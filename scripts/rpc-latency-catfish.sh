#!/usr/bin/env bash
#
# Measure round-trip latency of the catfish RPC nodes (3 tries each).

NODES=4
TRIES=3
PAYLOAD='{"jsonrpc":"2.0","id":1,"method":"chain_getBlock","params":[]}'

for n in $(seq 1 "$NODES"); do
  for i in $(seq 1 "$TRIES"); do
    curl -s -o /dev/null \
      -w "catfish-$n  try$i  total=%{time_total}s\n" \
      -X POST "https://node-catfish-$n.catfish.hydration.cloud" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD"
  done
done
