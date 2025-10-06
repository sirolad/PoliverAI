#!/usr/bin/env bash
set -euo pipefail

# docker-entrypoint.sh
# Generates an nginx config at container start that listens on $PORT and
# reverse proxies /api to the internal uvicorn server running on 127.0.0.1:8000.
# This pattern is Cloud Run friendly (Cloud Run terminates TLS and forwards HTTP to the container).

PORT=${PORT:-8080}
NGINX_CONF=/etc/nginx/conf.d/default.conf

cat > ${NGINX_CONF} <<'NGINX'
server {
    listen       PORT_PLACEHOLDER default_server;
    listen       [::]:PORT_PLACEHOLDER default_server;
    server_name  _;

    # Serve static frontend files
    root /usr/share/nginx/html;
    index index.html;

    location /_next/ { try_files $uri $uri/ =404; }
    location /static/ { try_files $uri $uri/ =404; }

    # Proxy API calls to internal uvicorn server
    location /api/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90;
    }

    # Proxy auth endpoints to backend (so /auth/login etc. are forwarded)
    location /auth/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90;
    }

    # Socket.IO / websocket upgrade support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 10s;
        proxy_read_timeout 3600s;
    }

    # Server-Sent Events / verify stream - proxy to backend and disable buffering
    location ^~ /verify-stream {
        proxy_pass http://127.0.0.1:8000/api/v1/verify-stream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "keep-alive";
        proxy_set_header Upgrade $http_upgrade;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        add_header Cache-Control "no-cache";
        proxy_set_header X-Accel-Buffering "no";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # fallback to index.html for SPA routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

# Substitute the runtime PORT into the generated nginx config
sed -i "s/PORT_PLACEHOLDER/${PORT}/g" ${NGINX_CONF}

# Start uvicorn in the background on 127.0.0.1:8000
# Ensure the application package is importable from the application root
export PYTHONPATH="/app:${PYTHONPATH:-}"
# If SKIP_NGINX is set, run uvicorn directly on $PORT (Cloud Run friendly). Otherwise
# run uvicorn on 127.0.0.1:8000 and proxy via nginx which serves static files.
if [ "${SKIP_NGINX:-0}" = "1" ] ; then
    echo "SKIP_NGINX=1; starting uvicorn directly on 0.0.0.0:${PORT}"
    # Run uvicorn in foreground so container PID 1 is uvicorn (Cloud Run health checks will pass)
    exec /opt/venv/bin/uvicorn poliverai.app.main:app --host 0.0.0.0 --port ${PORT} --app-dir /app
else
    # Run uvicorn bound to loopback and start nginx as the front-facing server
    /opt/venv/bin/uvicorn poliverai.app.main:app --host 127.0.0.1 --port 8000 --app-dir /app &

    # Wait for uvicorn to warm up and respond on the local /api/health endpoint
    # This avoids nginx returning 502 while the backend initializes.
    WAIT_RETRIES=${WAIT_RETRIES:-20}
    WAIT_SLEEP=${WAIT_SLEEP:-0.5}
    attempt=1
    echo "Waiting for uvicorn to become healthy on http://127.0.0.1:8000/api/health (max ${WAIT_RETRIES} attempts)"
    while [ $attempt -le ${WAIT_RETRIES} ]; do
        if curl -sS --max-time 1 http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
            echo "uvicorn is up (attempt ${attempt})"
            break
        fi
        attempt=$((attempt+1))
        sleep ${WAIT_SLEEP}
    done
    if [ $attempt -gt ${WAIT_RETRIES} ]; then
        echo "Warning: uvicorn did not respond within ${WAIT_RETRIES} attempts; starting nginx anyway"
    fi

    nginx -g 'daemon off;'
fi
