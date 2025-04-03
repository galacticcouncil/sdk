import type { NetworkContext } from '@acala-network/chopsticks-testing';
import type { Parachain } from '@galacticcouncil/xcm-core';

export type SetupCtx = NetworkContext & { config: Parachain };
