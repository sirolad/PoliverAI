#!/usr/bin/env bash
set -euo pipefail

# docker-entrypoint.sh
# Generates an nginx config at container start that listens on $PORT and
# reverse proxies /api to the internal uvicorn server running on 127.0.0.1:8000.
# This pattern is Cloud Run friendly (Cloud Run terminates TLS and forwards HTTP to the container).

PORT=${PORT:-8080}
NGINX_CONF=/etc/nginx/conf.d/default.conf

# If we're running inside Cloud Run, the platform sets K_SERVICE. In that case
# prefer to run uvicorn directly on $PORT (SKIP_NGINX=1) unless explicitly
# overridden. This ensures the main process listens on the container's $PORT
# which Cloud Run expects for health checks.
if [ -n "${K_SERVICE:-}" ] && [ -z "${SKIP_NGINX+x}" ]; then
    echo "Detected Cloud Run (K_SERVICE=${K_SERVICE:-}); defaulting SKIP_NGINX=1"
    SKIP_NGINX=1
fi

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

# Print the generated nginx config to the container stdout so it appears in Cloud Run logs
echo "===== GENERATED NGINX CONFIG (${NGINX_CONF}) ====="
cat ${NGINX_CONF} || true
echo "===== END NGINX CONFIG ====="

# Optional runtime installation of WeasyPrint system deps and pip package.
# This is disabled by default. To enable at container start, set
# INSTALL_WEASY_DEPS=1 (e.g., in your runtime environment or docker run -e ...).
if [ "${INSTALL_WEASY_DEPS:-0}" = "1" ]; then
    echo "INSTALL_WEASY_DEPS=1; attempting to install WeasyPrint system deps and pip package"
    # Only proceed if apt-get is available (Debian/Ubuntu based images)
    if command -v apt-get >/dev/null 2>&1; then
        export DEBIAN_FRONTEND=noninteractive
        echo "Updating apt and installing native libraries for WeasyPrint (this may take a while)"
        pip install --no-cache-dir weasyprint
        apt-get update
        apt-get install -y --no-install-recommends \
          libcairo2 \
          libpango-1.0-0 libpangocairo-1.0-0 libpangoft2-1.0-0 \
          libgdk-pixbuf-2.0-0 libglib2.0-0 libharfbuzz0b libfribidi0 \
          shared-mime-info \
          fonts-dejavu-core fonts-liberation fonts-noto-core
        rm -rf /var/lib/apt/lists/*
    else
        echo "apt-get not found; skipping native package install"
    fi

    # Install WeasyPrint into the virtualenv if present; fall back to system pip
    if [ -x /opt/venv/bin/pip ]; then
        echo "Installing weasyprint into venv (/opt/venv)"
        /opt/venv/bin/pip install --no-cache-dir weasyprint
    else
        echo "/opt/venv/bin/pip not found; attempting system pip"
        pip install --no-cache-dir weasyprint
    fi
    echo "WeasyPrint install step complete"
fi

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
    # Redirect uvicorn stdout/stderr to a logfile so we can surface startup errors
    UVICORN_LOG=/tmp/uvicorn.log
    rm -f ${UVICORN_LOG}
    echo "Starting uvicorn; logs -> ${UVICORN_LOG}"
    /opt/venv/bin/uvicorn poliverai.app.main:app --host 127.0.0.1 --port 8000 --app-dir /app > ${UVICORN_LOG} 2>&1 &
    UVICORN_PID=$!

    # Give uvicorn a short moment to begin initializing
    sleep 1

    # Wait for uvicorn to warm up and respond on the local /api/health endpoint
    # This avoids nginx returning 502 while the backend initializes.
    # Increase retries/sleep to accommodate slower startups (DB connections, warmups)
    WAIT_RETRIES=${WAIT_RETRIES:-60}
    WAIT_SLEEP=${WAIT_SLEEP:-1}
    attempt=1
    echo "Waiting for uvicorn to become healthy on http://127.0.0.1:8000/api/health (max ${WAIT_RETRIES} attempts)"
    while [ $attempt -le ${WAIT_RETRIES} ]; do
        # If uvicorn process exited, dump the log and exit (fail fast)
        if ! kill -0 ${UVICORN_PID} >/dev/null 2>&1; then
            echo "uvicorn process (pid ${UVICORN_PID}) has exited unexpectedly. Dumping log to stdout:" >&2
            sed -n '1,200p' ${UVICORN_LOG} || true
            echo "--- end uvicorn log ---" >&2
            exit 5
        fi

        echo "[startup-diagnostics] curl -sS -D - --max-time 2 http://127.0.0.1:8000/api/health || true"
        # Show headers and body when possible; don't fail the script if curl errors
        curl -sS -D - --max-time 2 http://127.0.0.1:8000/api/health || true
        if curl -sS --max-time 2 http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
            echo "uvicorn is up (attempt ${attempt})"
            break
        fi
        attempt=$((attempt+1))
        sleep ${WAIT_SLEEP}
    done
    if [ $attempt -gt ${WAIT_RETRIES} ]; then
        echo "Error: uvicorn did not respond within ${WAIT_RETRIES} attempts; dumping ${UVICORN_LOG} and exiting" >&2
        sed -n '1,400p' ${UVICORN_LOG} || true
        echo "--- end uvicorn log ---" >&2
        # Fail the container so Cloud Run restarts it instead of running nginx and returning 502s.
        exit 6
    fi

    # If uvicorn is healthy, start a background tail so its logs appear in container logs
    if [ -f ${UVICORN_LOG} ]; then
      tail -n +1 -F ${UVICORN_LOG} &
    fi

    nginx -g 'daemon off;'
fi
