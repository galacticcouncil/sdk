#!/usr/bin/env bash
#
# Measure round-trip latency of Hydration RPC endpoints (3 tries each).

ENDPOINTS=(
  "https://subway.sin.hydration.cloud"
  "https://subway.coke.hydration.cloud"
  "https://subway.shellfish.hydration.cloud"
  "https://rpc.kril.hydration.cloud"
)

PAYLOAD='{"jsonrpc":"2.0","id":1,"method":"chain_getBlock","params":[]}'
TRIES=3

for url in "${ENDPOINTS[@]}"; do
  host="${url#https://}"
  for i in $(seq 1 "$TRIES"); do
    curl -s -o /dev/null \
      -w "$host  try$i  total=%{time_total}s\n" \
      -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD"
  done
done
