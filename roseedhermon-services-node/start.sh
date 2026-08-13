#!/bin/sh

set -e

echo "Starting Hirondelle microservices..."

echo "Starting event microservice..."
node dist/ms-event/main.js &
EVENT_PID=$!

echo "Starting member microservice..."
node dist/ms-member/main.js &
MEMBER_PID=$!

echo "Starting gateway..."
node dist/gateway/main.js &
GATEWAY_PID=$!

echo "========================================"
echo "Hirondelle services started"
echo "Event PID   : $EVENT_PID"
echo "Member PID  : $MEMBER_PID"
echo "Gateway PID : $GATEWAY_PID"
echo "========================================"

cleanup() {
  echo "Stopping services..."

  kill "$EVENT_PID" 2>/dev/null || true
  kill "$MEMBER_PID" 2>/dev/null || true
  kill "$GATEWAY_PID" 2>/dev/null || true

  wait "$EVENT_PID" 2>/dev/null || true
  wait "$MEMBER_PID" 2>/dev/null || true
  wait "$GATEWAY_PID" 2>/dev/null || true
}

trap cleanup INT TERM

wait "$EVENT_PID" "$MEMBER_PID" "$GATEWAY_PID"
