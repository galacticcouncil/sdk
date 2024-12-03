import { testingPairs } from '@acala-network/chopsticks-testing';
import { Parachain } from '@galacticcouncil/xcm-core';

export const { alice, alith } = testingPairs();

export const getAccount = (chain: Parachain) => {
  return chain.usesH160Acc ? alith : alice;
};
