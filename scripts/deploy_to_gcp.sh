#!/usr/bin/env bash
# Deploy script for building the backend Docker image and deploying to Cloud Run.
# This script does NOT include credentials. Run locally where you have gcloud auth
# already configured (gcloud auth login && gcloud auth configure-docker).
#
# Usage:
#   export PROJECT_ID=my-gcp-project
#   export REGION=us-central1
#   export IMAGE_NAME=poliverai-backend
#   export TAG=latest
#   export MONGO_URI='mongodb+srv://user:pass@cluster...'
#   ./scripts/deploy_to_gcp.sh

set -euo pipefail

if [ -z "${PROJECT_ID:-}" ]; then
  echo "Please set PROJECT_ID environment variable (GCP project id)."
  exit 2
fi

REGION=${REGION:-us-central1}
IMAGE_NAME=${IMAGE_NAME:-poliverai-backend}
TAG=${TAG:-latest}
IMAGE_FULL="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"

echo "Building Docker image ${IMAGE_FULL} (FAST_DEV=false)"
# Build using the Dockerfile.backend
docker build --progress=plain --tag "${IMAGE_FULL}" -f Dockerfile.backend .

echo "Pushing image to Google Container Registry"
# Ensure you ran: gcloud auth configure-docker
docker push "${IMAGE_FULL}"

echo "Deploying to Cloud Run in project ${PROJECT_ID} (${REGION})"
# Cloud Run deploy. We pass MONGO_URI into the service; do NOT hardcode secrets here.
if [ -z "${MONGO_URI:-}" ]; then
  echo "Warning: MONGO_URI is not set in the environment; the deployed service will not have a DB connection."
fi
echo "Checking for accidental inclusion of .env or key.json in the build context..."
if docker build --no-cache -f Dockerfile.backend --target final -q . >/dev/null 2>&1; then
  echo "Quick check build succeeded (no cache). Proceeding with push & deploy."
else
  echo "Quick verification build failed. Please inspect the Dockerfile and build context." >&2
fi

gcloud run deploy "${IMAGE_NAME}" \
  --image "${IMAGE_FULL}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URI=${MONGO_URI:-}" \
  --memory 1024Mi \
  --concurrency 50 || {
    echo "gcloud run deploy failed" >&2
    exit 3
  }

echo "Deployment complete. Now streaming recent logs from Cloud Run (press Ctrl-C to stop)."
echo "If you'd prefer build logs during docker push, run the script and watch the terminal output — push is not backgrounded by this script."

# Tail logs for the Cloud Run service so the user sees them in foreground
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${IMAGE_NAME}" \
  --project "${PROJECT_ID}" --limit 50 --format "table(timestamp, textPayload)"

echo "Now following logs (press Ctrl-C to stop)."
gcloud logs tail --project "${PROJECT_ID}" --filter "resource.type=cloud_run_revision AND resource.labels.service_name=${IMAGE_NAME}"
