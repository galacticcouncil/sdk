import { Asset } from '@galacticcouncil/xc-core';

export const aave = new Asset({
  key: 'aave',
  originSymbol: 'AAVE',
});

export const ajun = new Asset({
  key: 'ajun',
  originSymbol: 'AJUN',
});

export const apyusd = new Asset({
  key: 'apyusd',
  originSymbol: 'apyUSD',
});

export const astr = new Asset({
  key: 'astr',
  originSymbol: 'ASTR',
});

export const bnc = new Asset({
  key: 'bnc',
  originSymbol: 'BNC',
});

export const bsx = new Asset({
  key: 'bsx',
  originSymbol: 'BSX',
});

export const cfg_new = new Asset({
  key: 'cfg_new',
  originSymbol: 'CFG',
});

export const cru = new Asset({
  key: 'cru',
  originSymbol: 'CRU',
});

export const dai = new Asset({
  key: 'dai',
  originSymbol: 'DAI',
});

export const dai_wh = new Asset({
  ...dai,
  key: 'dai_wh',
});

export const dot = new Asset({
  key: 'dot',
  originSymbol: 'DOT',
});

export const eth = new Asset({
  key: 'eth',
  originSymbol: 'ETH',
});

export const ena = new Asset({
  key: 'ena',
  originSymbol: 'ENA',
});

export const eurc = new Asset({
  key: 'eurc',
  originSymbol: 'EURC',
});

export const eurc_wh = new Asset({
  ...eurc,
  key: 'eurc_wh',
});

export const glmr = new Asset({
  key: 'glmr',
  originSymbol: 'GLMR',
});

export const hdx = new Asset({
  key: 'hdx',
  originSymbol: 'HDX',
});

export const ibtc = new Asset({
  key: 'ibtc',
  originSymbol: 'IBTC',
});

export const intr = new Asset({
  key: 'intr',
  originSymbol: 'INTR',
});

export const jito_sol = new Asset({
  key: 'jitoSol',
  originSymbol: 'jitoSOL',
});

export const ksm = new Asset({
  key: 'ksm',
  originSymbol: 'KSM',
});

export const ldo = new Asset({
  key: 'ldo',
  originSymbol: 'LDO',
});

export const lbtc = new Asset({
  key: 'lbtc',
  originSymbol: 'LBTC',
});

export const ewt = new Asset({
  key: 'ewt',
  originSymbol: 'EWT',
});

export const link = new Asset({
  key: 'link',
  originSymbol: 'LINK',
});

export const myth = new Asset({
  key: 'myth',
  originSymbol: 'MYTH',
});

export const near = new Asset({
  key: 'near',
  originSymbol: 'NEAR',
});

export const neuro = new Asset({
  key: 'neuro',
  originSymbol: 'NEURO',
});

export const pen = new Asset({
  key: 'pen',
  originSymbol: 'PEN',
});

export const paxg = new Asset({
  key: 'paxg',
  originSymbol: 'PAXG',
});

export const prime = new Asset({
  key: 'prime',
  originSymbol: 'PRIME',
});

export const sky = new Asset({
  key: 'sky',
  originSymbol: 'SKY',
});

export const sol = new Asset({
  key: 'sol',
  originSymbol: 'SOL',
});

export const sui = new Asset({
  key: 'sui',
  originSymbol: 'SUI',
});

export const susde = new Asset({
  key: 'susde',
  originSymbol: 'sUSDe',
});

export const susds = new Asset({
  key: 'susds',
  originSymbol: 'sUSDS',
});

export const susds_wh = new Asset({
  ...susds,
  key: 'susds_wh',
});

export const tbtc = new Asset({
  key: 'tbtc',
  originSymbol: 'tBTC',
});

export const trac = new Asset({
  key: 'trac',
  originSymbol: 'TRAC',
});

export const unq = new Asset({
  key: 'unq',
  originSymbol: 'UNQ',
});

export const usdt = new Asset({
  key: 'usdt',
  originSymbol: 'USDT',
});

export const usdt_wh = new Asset({
  ...usdt,
  key: 'usdt_wh',
});

export const usdt_eth = new Asset({
  ...usdt,
  key: 'usdt_eth',
});

export const usdc = new Asset({
  key: 'usdc',
  originSymbol: 'USDC',
});

export const usdc_wh = new Asset({
  ...usdc,
  key: 'usdc_wh',
});

export const usdc_eth = new Asset({
  ...usdc,
  key: 'usdc_eth',
});

export const vastr = new Asset({
  key: 'vastr',
  originSymbol: 'vASTR',
});

export const vdot = new Asset({
  key: 'vdot',
  originSymbol: 'vDOT',
});

export const weth = new Asset({
  key: 'weth',
  originSymbol: 'WETH',
});

export const weth_wh = new Asset({
  ...weth,
  key: 'weth_wh',
});

export const wbtc = new Asset({
  key: 'wbtc',
  originSymbol: 'WBTC',
});

export const wbtc_wh = new Asset({
  ...wbtc,
  key: 'wbtc_wh',
});

export const wsol = new Asset({
  key: 'wsol',
  originSymbol: 'wSOL',
});

export const wsteth = new Asset({
  key: 'wsteth',
  originSymbol: 'wstETH',
});

export const wud = new Asset({
  key: 'wud',
  originSymbol: 'WUD',
});

export const zec = new Asset({
  key: 'zec',
  originSymbol: 'ZEC',
});

export const assets: Asset[] = [
  aave,
  ajun,
  apyusd,
  astr,
  bsx,
  cfg_new,
  cru,
  bnc,
  dai,
  dai_wh,
  dot,
  ena,
  eurc,
  eurc_wh,
  eth,
  glmr,
  hdx,
  ibtc,
  intr,
  ksm,
  ldo,
  lbtc,
  ewt,
  jito_sol,
  link,
  myth,
  near,
  neuro,
  paxg,
  pen,
  prime,
  sky,
  sol,
  sui,
  susde,
  susds,
  susds_wh,
  trac,
  tbtc,
  unq,
  usdc,
  usdc_wh,
  usdc_eth,
  usdt,
  usdt_wh,
  usdt_eth,
  vastr,
  vdot,
  wbtc,
  wbtc_wh,
  weth,
  weth_wh,
  wsol,
  wsteth,
  wud,
  zec,
];

export const assetsMap = new Map<string, Asset>(
  assets.map((asset) => [asset.key, asset])
);
