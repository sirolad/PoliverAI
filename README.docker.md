Local Docker Compose and Cloud Run notes

- To run locally with Docker Compose:

```bash
cd default
docker-compose up --build
```

- This will build two services:
  - `backend` (Python) exposed on host port 8000
  - `frontend` (Nginx serving Vite build) exposed on host port 8080 and proxying `/api/*` to the backend

- For Cloud Run deployment: build separate container images and deploy two services (frontend and backend). Use the frontend image behind a load balancer or Cloud Run domain with URL rewrite so the frontend is served on `/` and API on `/api` or use a single ingress with a Cloud Run service for the backend and Cloud CDN for frontend static files.

- If you prefer a single-image approach for Cloud Run, the nginx image can be combined with a lightweight reverse-proxy to the backend; however Cloud Run prefers single-process containers and scales per-service.
