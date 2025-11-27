import {
  Parachain,
  TransferValidation,
  TransferValidationConstraint,
} from '@galacticcouncil/xcm-core';

import { FeeValidation, DestFeeValidation } from './base';
import {
  HubEdValidation,
  HubFrozenValidation,
  HydrationEdValidation,
  HydrationMrlFeeValidation,
} from './chain';

type Matcher = { [key: string]: TransferValidationConstraint };

const Matchers: Matcher = {
  isAny: () => true,
  isHydration: (c) => c instanceof Parachain && c.parachainId === 2034,
  isHub: (c) => c instanceof Parachain && c.parachainId === 1000,
  isEvm: (c) => c.isEvmChain(),
} as const;

export const validations: TransferValidation[] = [
  new FeeValidation(Matchers.isAny, Matchers.isAny),
  new DestFeeValidation(Matchers.isAny, Matchers.isAny),
  new HubEdValidation(Matchers.isAny, Matchers.isHub),
  new HubFrozenValidation(Matchers.isHub, Matchers.isAny),
  new HydrationEdValidation(Matchers.isAny, Matchers.isHydration),
  new HydrationMrlFeeValidation(Matchers.isHydration, Matchers.isAny),
];
