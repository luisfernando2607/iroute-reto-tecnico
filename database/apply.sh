#!/usr/bin/env bash
# Aplica todos los scripts SQL en orden contra el contenedor iroute-sqlserver.
# Uso: ./database/apply.sh  (requiere `docker compose up -d` previo)
set -euo pipefail
cd "$(dirname "$0")"
PASS="${MSSQL_SA_PASSWORD:-IRoute#2026Strong}"
for f in $(ls [0-9]*.sql | sort); do
  echo ">> $f"
  docker exec -i iroute-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$PASS" -C -b -i /dev/stdin < "$f"
done
echo "Base de datos lista."
