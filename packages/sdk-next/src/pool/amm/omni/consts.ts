import { Binary, Enum, SizedHex } from 'polkadot-api';

export const ORACLE_NAME = Binary.toHex(
  Binary.fromText('omnipool')
) as SizedHex<8>;

export const ORACLE_PERIOD = Enum('Short');
