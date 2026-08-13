#!/bin/sh

set -e

echo "Starting Hirondelle microservices..."

wait_for_health() {
  local name=$1
  local port=$2
  local attempts=30
  local i
  for i in $(seq 1 $attempts); do
    if curl -sSf "http://localhost:$port/health" >/dev/null 2>&1; then
      echo "$name is healthy (port $port)"
      return 0
    fi
    sleep 1
  done
  echo "$name did not become healthy after ${attempts}s" >&2
  return 1
}

start_service() {
  local name=$1
  local script=$2
  local port=$3

  echo "Starting $name..."
  node "$script" &
  pid=$!
  eval ${name}_PID=$pid

  if ! wait_for_health "$name" "$port"; then
    echo "$name failed to start; see container logs for details." >&2
    kill "$pid" 2>/dev/null || true
    exit 1
  fi
}

start_service "event" "dist/ms-event/main.js" 8081
start_service "member" "dist/ms-member/main.js" 8082
start_service "gateway" "dist/gateway/main.js" 8080

echo "========================================"
echo "All Hirondelle services started"
echo "Event PID   : $event_PID"
echo "Member PID  : $member_PID"
echo "Gateway PID : $gateway_PID"
echo "========================================"

cleanup() {
  echo "Stopping services..."
  kill "$event_PID" 2>/dev/null || true
  kill "$member_PID" 2>/dev/null || true
  kill "$gateway_PID" 2>/dev/null || true
  wait "$event_PID" 2>/dev/null || true
  wait "$member_PID" 2>/dev/null || true
  wait "$gateway_PID" 2>/dev/null || true
}

trap cleanup INT TERM

wait "$event_PID" "$member_PID" "$gateway_PID"
