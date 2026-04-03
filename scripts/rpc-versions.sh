#!/usr/bin/env bash
#
# Query Hydration RPC endpoints and display version info in a table.

ENDPOINTS=(
  "https://rpc.helikon.io/hydradx"
  "https://hydration-rpc.n.dwellir.com"
  "https://hydration.dotters.network"
  "https://hydration.ibp.network"
  'https://rpc.lait.hydration.cloud'
  'https://rpc.roach.hydration.cloud'
  'https://rpc.zipp.hydration.cloud'
  'https://rpc.sin.hydration.cloud'
  'https://rpc.coke.hydration.cloud'
)

PAYLOAD='{"id":1,"jsonrpc":"2.0","method":"system_version","params":[]}'

# Table header
printf "\n%-42s  %-20s  %-10s  %-10s  %s\n" "Endpoint" "Version" "Runtime" "Node" "Arch"
printf "%-42s  %-20s  %-10s  %-10s  %s\n" \
  "$(printf '%0.s-' {1..42})" \
  "$(printf '%0.s-' {1..20})" \
  "$(printf '%0.s-' {1..10})" \
  "$(printf '%0.s-' {1..10})" \
  "$(printf '%0.s-' {1..20})"

for url in "${ENDPOINTS[@]}"; do
  result=$(curl -s -m 5 -H "Content-Type: application/json" -d "$PAYLOAD" "$url" \
    | sed 's/.*"result":"\([^"]*\)".*/\1/')

  if [[ -z "$result" || "$result" == *"error"* ]]; then
    printf "%-42s  %s\n" "$url" "ERROR: no response"
    continue
  fi

  # Parse: "45.0.0-139ded517 runtime 398.0.0 node 14.9.0 x86_64-linux-gnu"
  version=$(echo "$result" | awk '{print $1}')
  runtime=$(echo "$result" | awk '{print $3}')
  node=$(echo "$result" | awk '{print $5}')
  arch=$(echo "$result" | awk '{print $6}')

  printf "%-42s  %-20s  %-10s  %-10s  %s\n" "$url" "$version" "$runtime" "$node" "$arch"
done

printf "\n"
