This folder contains helper scripts for local development.

dump_local_mongo.sh
-------------------
Creates an archive dump of a local MongoDB instance suitable for restoring into MongoDB Atlas. The script supports dumping from an existing Mongo container or connecting to a host/port from a transient mongo docker image.

Examples:

# If your local Mongo runs in a container named 'mongo':
./scripts/dump_local_mongo.sh -c mongo -o dump.archive

# If mongod is reachable on localhost:27017 (host machine):
./scripts/dump_local_mongo.sh -H localhost -P 27017 -o dump.archive

# If you want an uncompressed archive (no gzip):
./scripts/dump_local_mongo.sh -n -c mongo -o dump.archive
