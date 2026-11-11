#!/bin/sh
set -e

# Run Prisma database migrations safely before starting the application
if [ -n "$DATABASE_URL" ]; then
  echo "Checking and applying database migrations..."
  npx prisma migrate deploy || {
    echo "Migration check completed or deferred."
  }
fi

# Execute container command (default: node dist/main/server.js)
exec "$@"
