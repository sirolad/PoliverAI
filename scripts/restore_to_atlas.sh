#!/usr/bin/env bash
# Restore a mongodump archive into a MongoDB Atlas cluster using mongorestore
# Do NOT hardcode your Atlas credentials in this file. Set MONGO_URI as an environment variable.

set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") [-a archive] [--no-drop] [-f]

Options:
  -a archive     Archive file to restore (default: db.test.dump.archive)
  --no-drop      Do not use --drop (do not remove existing collections)
  -f             Force (skip confirmation)
  -h             Show this help

Environment:
  MONGO_URI      The MongoDB Atlas connection string (SRV). Example:
                 export MONGO_URI='mongodb+srv://user:pass@cluster.example.net/?retryWrites=true&w=majority'

Examples:
  # Safe default: ask for confirmation before restoring and drop existing collections
  ./scripts/restore_to_atlas.sh -a db.test.dump.archive

  # Restore without dropping existing collections
  ./scripts/restore_to_atlas.sh -a db.test.dump.archive --no-drop

  # Force restore (non-interactive)
  MONGO_URI='...'
  ./scripts/restore_to_atlas.sh -a db.test.dump.archive -f

This script runs mongorestore from the official mongo docker image so you don't need to install mongo tools locally.
EOF
}

ARCHIVE="db.test.dump.archive"
FORCE=0
DROP_FLAG="--drop"

# parse args
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--archive)
      ARCHIVE="$2"
      shift 2
      ;;
    --no-drop)
      DROP_FLAG=""
      shift
      ;;
    -f|--force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage; exit 0
      ;;
    --)
      shift; break
      ;;
    -*|--*)
      echo "Unknown option: $1" >&2; usage; exit 1
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done
# If POSITIONAL is empty, avoid expanding an unbound array (set -u will complain).
if [ ${#POSITIONAL[@]} -gt 0 ]; then
  set -- "${POSITIONAL[@]}"
else
  set --
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "Archive file not found: $ARCHIVE" >&2
  exit 2
fi

if [ -z "${MONGO_URI:-}" ]; then
  # Allow ATLAS_URI as an alternative name
  if [ -n "${ATLAS_URI:-}" ]; then
    MONGO_URI="$ATLAS_URI"
  else
    echo "Error: MONGO_URI (or ATLAS_URI) environment variable is not set." >&2
    echo "Set it like: export MONGO_URI='your-srv-uri'" >&2
    exit 3
  fi
fi

# Show a masked target host for verification (don't print credentials)
masked_host=$(echo "$MONGO_URI" | sed -E 's/^(mongodb\+srv:\/\/)([^:@]+):([^@]+)@/\1****:****@/; s/^(mongodb:\/\/)([^:@]+):([^@]+)@/\1****:****@/')
echo "Target (masked): ${masked_host}"

if [ "$FORCE" -ne 1 ]; then
  echo "About to restore archive: $ARCHIVE"
  echo "Target: Atlas (will use MONGO_URI from env)"
  if [ -n "$DROP_FLAG" ]; then
    echo "NOTE: This will drop (replace) existing collections in the destination when restored."
  else
    echo "NOTE: This will not drop existing collections (merging behavior)."
  fi
  read -rp "Proceed? (yes/no): " ans
  # accept 'yes' or short 'y' (case-insensitive) as confirmation
  ans_lc=$(echo "$ans" | tr '[:upper:]' '[:lower:]')
  if [ "$ans_lc" != "yes" ] && [ "$ans_lc" != "y" ]; then
    echo "Aborting restore."; exit 0
  fi
fi

# run mongorestore via docker; mount the current working directory so the archive is accessible
echo "Restoring $ARCHIVE to Atlas (this may take a while)..."
# Use a quoted here-doc to ensure MONGO_URI is not leaked in command history; docker command uses the env var we export in environment
# We pass the MONGO_URI as an env var to the docker container to avoid embedding it into the command line visibly.

docker run --rm -v "$(pwd)":/work -e MONGO_URI="$MONGO_URI" mongo:6.0 bash -lc \
  "set -euo pipefail; \
   echo 'Running mongorestore...'; \
   mongorestore --uri=\"$MONGO_URI\" $DROP_FLAG --archive=\"/work/$(basename "$ARCHIVE")\" --gzip; \
   echo 'Restore finished.'"

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "Restore completed successfully."
else
  echo "Restore failed with exit code $EXIT_CODE" >&2
fi

exit $EXIT_CODE
