#!/usr/bin/env bash
# Dump local MongoDB to a single archive file (gzip) suitable for importing/restoring to Atlas
# Supports either: 1) running mongodump inside an existing mongo container, or
# 2) running mongodump from the official mongo docker image against a host endpoint.

set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") [-c container] [-H host] [-P port] [-o out]

Options:
  -c container   Docker container name (runs mongodump inside the container and copies out)
  -H host        Host to connect to (default: localhost)
  -P port        Port to connect to (default: 27017)
  -o out         Output archive filename (default: dump.archive)
  -n             No gzip (produce uncompressed archive)
  -h             Show this help

Examples:
  # If your local Mongo runs in a container named 'mongo':
  ./scripts/dump_local_mongo.sh -c mongo -o dump.archive

  # If mongod is reachable on localhost:27017 (host machine):
  ./scripts/dump_local_mongo.sh -H localhost -P 27017 -o dump.archive

  # Use host.docker.internal on Docker Desktop if needed:
  ./scripts/dump_local_mongo.sh -H host.docker.internal -P 27017 -o dump.archive

The produced archive is suitable for use with mongorestore or for upload to Atlas' import/restore tools.
EOF
}

OUT="dump.archive"
CONTAINER=""
HOST="localhost"
PORT="27017"
GZIP="--gzip"

while getopts ":c:H:P:o:nh" opt; do
  case ${opt} in
    c ) CONTAINER=$OPTARG ;;
    H ) HOST=$OPTARG ;;
    P ) PORT=$OPTARG ;;
    o ) OUT=$OPTARG ;;
    n ) GZIP="" ;;
    h ) usage; exit 0 ;;
    \? ) echo "Invalid Option: -$OPTARG" 1>&2; usage; exit 1 ;;
  esac
done

# Ensure output path is absolute (so docker cp/mount paths are clear)
OUT_ABS=$(pwd)/$OUT

if [ -n "$CONTAINER" ]; then
  echo "Running mongodump inside container '$CONTAINER'..."
  TMP_PATH="/tmp/$(basename "$OUT")"
  if [ -n "$GZIP" ]; then
    docker exec "$CONTAINER" mongodump --archive="$TMP_PATH" --gzip
  else
    docker exec "$CONTAINER" mongodump --archive="$TMP_PATH"
  fi
  echo "Copying archive from container to host: $OUT_ABS"
  docker cp "$CONTAINER":"$TMP_PATH" "$OUT_ABS"
  echo "Removing temporary archive inside container"
  docker exec "$CONTAINER" rm -f "$TMP_PATH" || true
  echo "Dump created: $OUT_ABS"
  exit 0
fi

# Otherwise run mongodump from mongo image and connect to host:port
echo "Running mongodump from mongo image against $HOST:$PORT ..."
# Use the official mongo image and mount current working directory so the archive appears in repo
if [ -n "$GZIP" ]; then
  docker run --rm -v "$(pwd)":/work mongo:6.0 mongodump --host "${HOST}:${PORT}" --archive="/work/${OUT}" --gzip
else
  docker run --rm -v "$(pwd)":/work mongo:6.0 mongodump --host "${HOST}:${PORT}" --archive="/work/${OUT}"
fi

if [ -f "$OUT_ABS" ]; then
  echo "Dump created: $OUT_ABS"
  exit 0
else
  echo "Failed to create dump at $OUT_ABS" >&2
  exit 2
fi
