#!/bin/bash

# Installer et démarrer MongoDB Community sur macOS sans Docker (Homebrew)
# Usage:
#   chmod +x start-mongodb-no-docker.sh
#   ./start-mongodb-no-docker.sh

set -euo pipefail

DB_NAME="db_rdh"
COLLECTION="events"
MAX_WAIT=30

echo "🔎 Vérification de Homebrew..."
if ! command -v brew >/dev/null 2>&1; then
  echo "❌ Homebrew n'est pas installé. Installez Homebrew d'abord:" >&2
  echo "   https://brew.sh/" >&2
  exit 1
fi

echo "🔎 Ajout du tap MongoDB..."
brew tap mongodb/brew >/dev/null 2>&1 || true

echo "🔎 Vérification de l'installation de mongodb-community..."
if ! brew list --formula | grep -q "mongodb-community"; then
  echo "⬇️  Installation de mongodb-community via Homebrew (peut demander sudo)..."
  brew install mongodb-community
fi

echo "▶️ Démarrage du service MongoDB..."
# Try to start service via brew services; fall back to direct mongod if needed
if command -v brew >/dev/null 2>&1; then
  brew services start mongodb-community || true
fi

echo "⏳ Attente que le serveur MongoDB soit prêt (max ${MAX_WAIT}s)..."
SECONDS_WAIT=0
until command -v mongosh >/dev/null 2>&1 && mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  sleep 2
  SECONDS_WAIT=$((SECONDS_WAIT + 2))
  if [ ${SECONDS_WAIT} -ge ${MAX_WAIT} ]; then
    echo "❌ Impossible de joindre mongosh après ${MAX_WAIT}s. Vérifiez l'installation et les logs." >&2
    echo "Essayez: brew services list" >&2
    exit 1
  fi
done

echo "✅ mongosh disponible et MongoDB répond"

echo "📁 Initialisation de la base '${DB_NAME}' et de la collection '${COLLECTION}'..."
mongosh --quiet <<EOF
use ${DB_NAME}
db.createCollection('${COLLECTION}')
db.${COLLECTION}.createIndex({ createdAt: 1 })
EOF

echo "✅ Base initialisée : ${DB_NAME}.${COLLECTION}"

cat <<USAGE
Pour utiliser cette base locale avec votre application Spring Boot:

  cd roseedhermon-ms-event
  SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

Notes:
- Si vous préférez démarrer MongoDB manuellement: "brew services start mongodb-community"
- Pour arrêter: "brew services stop mongodb-community"
- Pour vérifier l'état: "brew services list"

USAGE

exit 0
