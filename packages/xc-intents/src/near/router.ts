import { addr, type NearClient } from '@galacticcouncil/xc-core';

import { MPC_DOMAIN_ED25519, WNEAR } from '../consts';
import { RecipientKind } from '../terms/types';

/** NEAR reads the router needs. */
export type NearReader = Pick<NearClient, 'view' | 'viewAccount'>;

/** Router's way out to a coin's own chain: a `utxo_routes()` value. */
export interface UtxoRoute {
  /** Withdraw contract validating and paying the address */
  withdraw: string;
  path_prefix: string;
  /** Address prefixes the withdraw contract takes */
  address_prefixes: string[];
  /** Least the router pays out at once, in the token's base units */
  min_amount: string;
}

/** A NEAR account id: lowercase parts joined by `.`, 2 to 64 characters. */
const RE_ACCOUNT_ID =
  /^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

/** Shielded Zcash: sapling (`zs`) and unified (`u1`) — not deliverable. */
const RE_SHIELDED_ZEC = /^(zs|u1)/i;

/** Intents router on NEAR and the MPC signer behind its accounts. */
export class IntentsRouter {
  constructor(
    readonly near: NearReader,
    readonly router: string,
    readonly signer: string
  ) {}

  /** UTXO routes, by intents ledger id. */
  utxoRoutes(): Promise<Record<string, UtxoRoute>> {
    return this.near.view<Record<string, UtxoRoute>>(
      this.router,
      'utxo_routes',
      {}
    );
  }

  /**
   * Deposit account `A` for a set of terms.
   *
   * - Implicit account of the Ed25519 key `v1.signer` derives for the router
   * - Lowercase hex of the 32 key bytes
   *
   * @param authPath - terms' path, `0x` + lowercase hex
   */
  async deriveAccount(authPath: string): Promise<string> {
    const key = await this.near.view<string>(
      this.signer,
      'derived_public_key',
      {
        path: authPath,
        predecessor: this.router,
        domain_id: MPC_DOMAIN_ED25519,
      }
    );
    return addr.NearAddr.fromPublicKey(key);
  }

  /**
   * Checks the router will pay `recipient` as the terms ask.
   *
   * - Withdrawal of a UTXO coin: prefix, then the withdraw contract's `path_of`
   * - Withdrawal of wNEAR: the NEAR account must exist
   * - Intents transfer: a valid NEAR account id
   *
   * @param asset - destination ledger id
   * @param kind - terms' recipient kind
   * @param recipient - terms' recipient
   * @returns the UTXO route the payout takes, if any
   * @throws when the router would not deliver to `recipient`
   */
  async checkRecipient(
    asset: string,
    kind: RecipientKind,
    recipient: string
  ): Promise<UtxoRoute | undefined> {
    if (kind === RecipientKind.IntentsAccount) {
      if (!RE_ACCOUNT_ID.test(recipient)) {
        throw new Error(`${recipient} is no NEAR account id`);
      }
      return undefined;
    }

    if (asset === WNEAR) {
      if (!RE_ACCOUNT_ID.test(recipient)) {
        throw new Error(`${recipient} is no NEAR account id`);
      }
      const account = await this.near.viewAccount(recipient);
      if (!account) {
        throw new Error(
          `${recipient} is no NEAR account: intents.near would keep the NEAR`
        );
      }
      return undefined;
    }

    if (RE_SHIELDED_ZEC.test(recipient)) {
      throw new Error(`Shielded address ${recipient} is not deliverable`);
    }

    const route = (await this.utxoRoutes())[asset];
    if (!route) {
      throw new Error(`${this.router} has no UTXO route for ${asset}`);
    }
    if (!route.address_prefixes.some((p) => recipient.startsWith(p))) {
      throw new Error(
        `${route.withdraw} takes ${route.address_prefixes.join(' / ')} addresses, not ${recipient}`
      );
    }
    try {
      await this.near.view<string>(route.withdraw, 'path_of', {
        address: recipient,
      });
    } catch (e) {
      throw new Error(
        `${route.withdraw} rejects ${recipient}: ${(e as Error).message}`
      );
    }
    return route;
  }
}
