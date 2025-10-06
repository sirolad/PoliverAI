This folder contains helper scripts for local development.

dump_local_mongo.sh
Creates an archive dump of a local MongoDB instance suitable for restoring into MongoDB Atlas. The script supports dumping from an existing Mongo container or connecting to a host/port from a transient mongo docker image.

Examples:

# If your local Mongo runs in a container named 'mongo':
./scripts/dump_local_mongo.sh -c mongo -o dump.archive

# If mongod is reachable on localhost:27017 (host machine):
./scripts/dump_local_mongo.sh -H localhost -P 27017 -o dump.archive

# If you want an uncompressed archive (no gzip):
./scripts/dump_local_mongo.sh -n -c mongo -o dump.archive

deploy_to_gcp.sh
-----------------
Builds the backend Docker image (using Dockerfile.deployer), pushes it to Google Container Registry and deploys it to Cloud Run. Requires local gcloud authentication and PROJECT_ID environment variable. The script expects MONGO_URI to be present in the environment when deploying so the service can connect to MongoDB Atlas.
