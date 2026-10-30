/** A PSM corridor: usdc locked on an evm chain backs HOLLAR on hydration. */
export interface PsmCorridor {
  /** `HollarBaseVault` proxy on the evm chain. */
  vault: string;
  /** `HollarBaseFacilitator` proxy on hydration. */
  facilitator: string;
}

/** Mainnet corridors, by evm chain key - deposits leave it, redeems land on it. */
export const PSM_CORRIDORS: Record<string, PsmCorridor> = {
  base: {
    vault: '0xd5FD74F570343245AFcE4a4C0B24b59179cfdfA7',
    facilitator: '0xdA30CfDf3647C291Cb3b0EeD6Ac5f0fEa7f393c4',
  },
};
