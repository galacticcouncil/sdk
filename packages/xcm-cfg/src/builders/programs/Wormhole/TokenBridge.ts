import {
  EvmParachain,
  ProgramConfig,
  ProgramConfigBuilder,
  SolanaChain,
  Wormhole as Wh,
} from '@galacticcouncil/xcm-core';

import {
  ACCOUNT_SIZE,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
} from '@solana/spl-token';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';

import { UniversalAddress } from '@wormhole-foundation/sdk-connect';
import {
  createApproveAuthoritySignerInstruction,
  createTransferNativeInstruction,
} from '@wormhole-foundation/sdk-solana-tokenbridge';

type TransferMrlOpts = {
  moonchain: EvmParachain;
};

const transferNative = () => {
  return {
    viaMrl: (opts: TransferMrlOpts): ProgramConfigBuilder => ({
      build: async (params) => {
        const { address, amount, source, sender } = params;
        const ctx = source.chain;

        const ctxSol = ctx as SolanaChain;
        const ctxWh = Wh.fromChain(ctx);
        const rcvWh = Wh.fromChain(opts.moonchain);

        const senderAddress = new PublicKey(sender);
        const receiverAddress = new UniversalAddress(
          '0x26f5C2370e563e9f4dDA435f03A63D7C109D8D04'
        );

        // Payer can be technically different from the sender.
        const payerPublicKey = senderAddress;

        const nonce = 0;
        const relayerFee = 0n;

        const messageKeypair = Keypair.generate();
        const ancillaryKeypair = Keypair.generate();

        // Spl token accounts need rent exemption
        const rentBalance = await getMinimumBalanceForRentExemptAccount(
          ctxSol.connection
        );

        // Create a temporary account where the wSOL will be created.
        const createAncillaryAccountIx = SystemProgram.createAccount({
          fromPubkey: payerPublicKey,
          newAccountPubkey: ancillaryKeypair.publicKey,
          lamports: rentBalance,
          space: ACCOUNT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        });

        // Send in the amount of SOL which we want converted to wSOL
        const initialBalanceTransferIx = SystemProgram.transfer({
          fromPubkey: payerPublicKey,
          lamports: amount,
          toPubkey: ancillaryKeypair.publicKey,
        });

        // Initialize the account as a WSOL account, with the original payerAddress as owner
        const initAccountIx = createInitializeAccountInstruction(
          ancillaryKeypair.publicKey,
          NATIVE_MINT,
          payerPublicKey
        );

        // Normal approve & transfer instructions, except that the wSOL is sent from the ancillary account.
        const approvalIx = createApproveAuthoritySignerInstruction(
          ctxWh.getTokenBridge(),
          ancillaryKeypair.publicKey,
          payerPublicKey,
          amount
        );

        const tokenBridgeTransferIx = createTransferNativeInstruction(
          ctxSol.connection,
          ctxWh.getTokenBridge(),
          ctxWh.getCoreBridge(),
          sender,
          messageKeypair.publicKey,
          ancillaryKeypair.publicKey,
          NATIVE_MINT,
          nonce,
          amount,
          relayerFee,
          receiverAddress.toUint8Array(),
          rcvWh.getWormholeId()
        );

        // Close the ancillary account for cleanup. Payer address receives any remaining funds
        const closeAccountIx = createCloseAccountInstruction(
          ancillaryKeypair.publicKey,
          payerPublicKey,
          payerPublicKey
        );

        return new ProgramConfig({
          instructions: [
            createAncillaryAccountIx,
            initialBalanceTransferIx,
            initAccountIx,
            approvalIx,
            tokenBridgeTransferIx,
            closeAccountIx,
          ],
          signers: [messageKeypair, ancillaryKeypair],
          func: 'TransferNative',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

export const TokenBridge = () => {
  return {
    transferNative,
  };
};
