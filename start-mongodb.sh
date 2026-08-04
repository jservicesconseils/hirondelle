#!/bin/bash

# Script pour démarrer MongoDB avec Docker et initialiser la base locale
# Usage: ./start-mongodb.sh

set -euo pipefail

CONTAINER_NAME="mongodb-local"
IMAGE="mongo:latest"
PORT="27017"
DB_NAME="db_rdh"

echo "🚀 Démarrage de MongoDB local..."

# Vérifier si Docker est installé
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker n'est pas installé. Installez Docker Desktop et réessayez."
    exit 1
fi

# Vérifier si Docker est en cours d'exécution
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Démarrez Docker Desktop et réessayez."
    exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Conteneur existant trouvé : ${CONTAINER_NAME}. Démarrage..."
    docker start "${CONTAINER_NAME}" >/dev/null
else
    echo "📦 Création et démarrage d'un nouveau conteneur MongoDB : ${CONTAINER_NAME}"
    docker run -d \
        --name "${CONTAINER_NAME}" \
        -p ${PORT}:27017 \
        -v mongodb-data:/data/db \
        "${IMAGE}"
fi

echo "⏳ Attente que MongoDB soit prêt (10s)..."
sleep 10

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Échec du démarrage du conteneur ${CONTAINER_NAME}." >&2
    docker logs "${CONTAINER_NAME}" || true
    exit 1
fi

echo "✅ MongoDB en cours d'exécution sur localhost:${PORT}"

echo "📁 Initialisation de la base '${DB_NAME}' et de la collection 'events'..."
docker exec -i "${CONTAINER_NAME}" mongosh --quiet <<EOF
use ${DB_NAME}
db.createCollection('events')
db.events.createIndex({"createdAt": 1})
EOF

echo "✅ Initialisation terminée : base=${DB_NAME}, collection=events"

cat <<USAGE
Pour lancer votre application avec la configuration locale MongoDB:

    cd roseedhermon-ms-event
    SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

Arrêter MongoDB:
    docker stop ${CONTAINER_NAME}

Supprimer le conteneur (et ses données si vous le souhaitez):
    docker rm -v ${CONTAINER_NAME}

USAGE


