export const chainSpec = `{
  "name": "Hydration",
  "id": "hydra",
  "chainType": "Live",
  "bootNodes": [
    "/dns/p2p-01.hydra.hydradx.io/tcp/30333/p2p/12D3KooWHzv7XVVBwY4EX1aKJBU6qzEjqGk6XtoFagr5wEXx6MsH",
    "/dns/p2p-02.hydra.hydradx.io/tcp/30333/p2p/12D3KooWR72FwHrkGNTNes6U5UHQezWLmrKu6b45MvcnRGK8J3S6",
    "/dns/p2p-03.hydra.hydradx.io/tcp/30333/p2p/12D3KooWFDwxZinAjgmLVgsideCmdB2bz911YgiQdLEiwKovezUz",
    "/dns4/boot.helikon.io/tcp/15120/p2p/12D3KooWDcQY1L2ny3F7YPyP4snCZZYc4eKWgPLEzdBvWBUjH5Yt",
    "/dns4/boot.helikon.io/tcp/15125/wss/p2p/12D3KooWDcQY1L2ny3F7YPyP4snCZZYc4eKWgPLEzdBvWBUjH5Yt",
    "/dns/hydration.boot.stake.plus/tcp/30332/wss/p2p/12D3KooWGZaDfqPyzVxhA3k1qv72P7xqYTJS8W9U7GWUEdXYhtUU",
    "/dns/hydration.boot.stake.plus/tcp/31332/wss/p2p/12D3KooWBJMG8LCh6pLYbGapA3SNzjhQWE87ieGux41jKQrrf5js",
    "/dns/hydration-boot-ng.dwellir.com/tcp/443/wss/p2p/12D3KooWMNf1YGh3rxaiWPjzQ1UKQxKq2WSjAKdrSgdcYaFH4ie5",
    "/dns/hydration-boot-ng.dwellir.com/tcp/30366/p2p/12D3KooWMNf1YGh3rxaiWPjzQ1UKQxKq2WSjAKdrSgdcYaFH4ie5",
    "/dns/hydration-bootnode.radiumblock.com/tcp/30333/p2p/12D3KooWCtrMH4H2p5XkGHkU7K4CcbSmErouNuN3j7Bysj4a8hJX",
    "/dns/hydration-bootnode.radiumblock.com/tcp/30336/wss/p2p/12D3KooWCtrMH4H2p5XkGHkU7K4CcbSmErouNuN3j7Bysj4a8hJX"
  ],
  "telemetryEndpoints": [
    ["/dns/telemetry.polkadot.io/tcp/443/x-parity-wss/%2Fsubmit%2F", 0],
    ["/dns/telemetry.hydradx.io/tcp/9000/x-parity-wss/%2Fsubmit%2F", 0]
  ],
  "protocolId": "hdx",
  "properties": {
    "tokenDecimals": 12,
    "tokenSymbol": "HDX"
  },
  "relay_chain": "polkadot",
  "para_id": 2034,
  "codeSubstitutes": {},
  "genesis": {
    "stateRootHash": "0x33a542156b00e7dd467e2b7704563abd84f888ccbc6afd6f1a1802a55db1d4de"
  }
}`;
