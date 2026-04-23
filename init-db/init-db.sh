#!/bin/sh
# sneakerhead/init-db/init-db.sh
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  SELECT 'CREATE DATABASE userdb'
    WHERE NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'userdb')\gexec
  SELECT 'CREATE DATABASE productdb'
    WHERE NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'productdb')\gexec
  SELECT 'CREATE DATABASE orderdb'
    WHERE NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'orderdb')\gexec
EOSQL
