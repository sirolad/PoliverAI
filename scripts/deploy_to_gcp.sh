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
  # Try to auto-detect gcloud configured project
  if command -v gcloud >/dev/null 2>&1; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || "")
    # Trim surrounding whitespace/newlines (helps if pasted or contains stray CR/LF)
    PROJECT_ID=$(echo "${PROJECT_ID}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  fi
  if [ -z "${PROJECT_ID:-}" ]; then
    echo "Please set PROJECT_ID environment variable (GCP project id) or configure gcloud (gcloud config set project <id>)."
    exit 2
  fi
  echo "Using PROJECT_ID=${PROJECT_ID} (from gcloud config)"
fi

REGION=${REGION:-us-central1}
IMAGE_NAME=${IMAGE_NAME:-poliverai-app}
TAG=${TAG:-latest}
IMAGE_FULL="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}"

# By default we load environment variables from .env in the repo root.
ENV_FILE=${ENV_FILE:-.env}

# Build a comma-separated KEY=VAL string for --set-env-vars. We avoid printing values.
ENV_PAIRS=""
if [ -f "${ENV_FILE}" ]; then
  # Read non-empty, non-comment lines
  while IFS= read -r line || [ -n "$line" ]; do
    # strip leading/trailing whitespace
    line=$(echo "$line" | sed -e 's/^\s*//' -e 's/\s*$//')
    [ -z "$line" ] && continue
    echo "$line" | grep -Eq '^\s*#' && continue
    # Only accept KEY=VAL
    if echo "$line" | grep -q '='; then
      key=$(echo "$line" | cut -d'=' -f1)
  val=$(echo "$line" | cut -d'=' -f2-)
  # Remove surrounding single or double quotes from the value if present
  val=$(echo "$val" | sed -e "s/^['\"]//" -e "s/['\"]$//")
      # Trim whitespace around key
      key=$(echo "$key" | sed -e 's/^\s*//' -e 's/\s*$//')
      # Append to env pairs. We keep raw value here to pass to gcloud but we won't echo it.
      if [ -z "$ENV_PAIRS" ]; then
        ENV_PAIRS="${key}=${val}"
      else
        ENV_PAIRS="${ENV_PAIRS},${key}=${val}"
      fi
      # Print a masked preview for the user
      echo "Will pass env var: ${key} (value masked)"
    fi
  done < "${ENV_FILE}"
else
  echo "Env file ${ENV_FILE} not found; proceeding without file-sourced env vars."
fi

# If a key.json exists in the repo root, offer to upload it to Secret Manager and pass it to Cloud Run.
KEY_FILE=${KEY_FILE:-key.json}
SECRET_NAME=${SECRET_NAME:-poliverai-key-json}
USE_KEY_SECRET=false
if [ -f "${KEY_FILE}" ]; then
  echo "Found ${KEY_FILE} in repository. Will upload to Secret Manager as ${SECRET_NAME} and pass to Cloud Run."
  # Create secret if it does not exist
  if ! gcloud secrets describe "${SECRET_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
    echo "Creating secret ${SECRET_NAME} in Secret Manager..."
    gcloud secrets create "${SECRET_NAME}" --replication-policy="automatic" --project "${PROJECT_ID}"
  fi
  # Add the file as a new secret version
  echo "Adding new secret version from ${KEY_FILE}..."
  gcloud secrets versions add "${SECRET_NAME}" --data-file="${KEY_FILE}" --project "${PROJECT_ID}"
  USE_KEY_SECRET=true
fi

FAST_DEV=${FAST_DEV:-true}
echo "Building Docker image ${IMAGE_FULL} (FAST_DEV=${FAST_DEV})"
# Build using the Dockerfile.deployer; pass FAST_DEV build arg so heavy deps can be skipped when needed.
docker build --progress=plain --build-arg FAST_DEV=${FAST_DEV} --tag "${IMAGE_FULL}" -f Dockerfile.deployer .

echo "Pushing image to Google Container Registry"
# Ensure you ran: gcloud auth configure-docker
docker push "${IMAGE_FULL}"

echo "Deploying to Cloud Run in project ${PROJECT_ID} (${REGION})"
# Cloud Run deploy. We pass MONGO_URI into the service; do NOT hardcode secrets here.
if [ -z "${MONGO_URI:-}" ]; then
  echo "Warning: MONGO_URI is not set in the environment; the deployed service will not have a DB connection."
fi
echo "Checking for accidental inclusion of .env or key.json in the build context..."
if docker build --no-cache -f Dockerfile.deployer --target final -q . >/dev/null 2>&1; then
  echo "Quick check build succeeded (no cache). Proceeding with push & deploy."
else
  echo "Quick verification build failed. Printing the last 200 lines of a verbose no-cache build to help debug:" >&2
  # Run a verbose build and show the last 200 lines to help debugging
  if ! docker build --no-cache -f Dockerfile.deployer --target final . 2>&1 | tail -n 200 >&2; then
    echo "Verbose build also failed (see output above)." >&2
  fi
  echo "Please inspect the Dockerfile and build context." >&2
fi

DEPLOY_CMD=(gcloud run deploy "${IMAGE_NAME}" \
  --image "${IMAGE_FULL}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 1024Mi \
  --concurrency 50)

if [ -n "${ENV_PAIRS:-}" ]; then
  DEPLOY_CMD+=(--set-env-vars "${ENV_PAIRS}")
elif [ -n "${MONGO_URI:-}" ]; then
  # Fallback to MONGO_URI only (backwards compatible)
  DEPLOY_CMD+=(--set-env-vars "MONGO_URI=${MONGO_URI}")
else
  # Don't pass empty --set-env-vars; deploy without extra environment variables.
  echo "No environment variables to pass to Cloud Run (neither ${ENV_FILE} provided nor MONGO_URI)."
fi

# If we created/added a secret for key.json, map it into the service as an env var KEY_JSON
if [ "${USE_KEY_SECRET}" = true ]; then
  # Map the secret payload into the env var KEY_JSON
  # Cloud Run supports --set-secrets VAR=SECRET:VERSION
  DEPLOY_CMD+=(--set-secrets "KEY_JSON=${SECRET_NAME}:latest")
  echo "Will pass secret ${SECRET_NAME} as env var KEY_JSON to Cloud Run."
fi

"${DEPLOY_CMD[@]}" || {
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
