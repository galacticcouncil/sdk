import {
  mrl,
  EvmParachain,
  Parachain,
  Precompile,
  ProgramConfig,
  ProgramConfigBuilder,
  SolanaChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import {
  ACCOUNT_SIZE,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';

import { UniversalAddress } from '@wormhole-foundation/sdk-connect';
import {
  createApproveAuthoritySignerInstruction,
  createTransferNativeWithPayloadInstruction,
  getWrappedMeta,
} from '@wormhole-foundation/sdk-solana-tokenbridge';

type TransferMrlOpts = {
  moonchain: EvmParachain;
};

const transferNativeWithPayload = () => {
  return {
    viaMrl: (opts: TransferMrlOpts): ProgramConfigBuilder => ({
      build: async (params) => {
        const { address, amount, source, sender, destination } = params;
        const ctx = source.chain;
        const ctxSol = ctx as SolanaChain;

        const ctxWh = Wh.fromChain(ctx);
        const rcvWh = Wh.fromChain(opts.moonchain);

        const recipient = Precompile.Bridge;
        const payload = await mrl.createPayload(
          destination.chain as Parachain,
          address
        );

        const senderAddress = new PublicKey(sender);
        const recipientAddress = new UniversalAddress(recipient);
        const recipientChainId = rcvWh.getWormholeId();

        // Payer can be technically different from the sender.
        const payerPublicKey = senderAddress;

        const nonce = 0;

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

        const tokenBridgeTransferIx =
          createTransferNativeWithPayloadInstruction(
            ctxSol.connection,
            ctxWh.getTokenBridge(),
            ctxWh.getCoreBridge(),
            sender,
            messageKeypair.publicKey,
            ancillaryKeypair.publicKey,
            NATIVE_MINT,
            nonce,
            amount,
            recipientAddress.toUint8Array(),
            recipientChainId,
            payload.toU8a()
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
          func: 'TransferNativeWithPayload',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

const transferTokenWithPayload = () => {
  return {
    viaMrl: (opts: TransferMrlOpts): ProgramConfigBuilder => ({
      build: async (params) => {
        const { address, amount, asset, source, sender, destination } = params;
        const ctx = source.chain;
        const ctxSol = ctx as SolanaChain;

        const ctxWh = Wh.fromChain(ctx);
        const rcvWh = Wh.fromChain(opts.moonchain);

        const recipient = Precompile.Bridge;
        const payload = await mrl.createPayload(
          destination.chain as Parachain,
          address
        );

        const senderAddress = new PublicKey(sender);

        const tokenId = source.chain.getAssetId(asset);
        const tokenAddress = new PublicKey(tokenId);
        const senderTokenAddress = await getAssociatedTokenAddress(
          tokenAddress,
          senderAddress
        );

        const recipientAddress = new UniversalAddress(recipient);
        const recipientChainId = rcvWh.getWormholeId();

        const isWrapped = await getWrappedMeta(
          ctxSol.connection,
          ctxWh.getTokenBridge(),
          tokenAddress
        )
          .catch((_) => null)
          .then((meta) => meta != null);

        if (isWrapped) {
          throw new Error('Wrapped assets not supported yet');
        }

        const nonce = 0;

        const messageKeypair = Keypair.generate();

        const approvalIx = createApproveAuthoritySignerInstruction(
          ctxWh.getTokenBridge(),
          senderTokenAddress,
          senderAddress,
          amount
        );

        const tokenBridgeTransferIx =
          createTransferNativeWithPayloadInstruction(
            ctxSol.connection,
            ctxWh.getTokenBridge(),
            ctxWh.getCoreBridge(),
            sender,
            messageKeypair.publicKey,
            senderTokenAddress,
            tokenAddress,
            nonce,
            amount,
            recipientAddress.toUint8Array(),
            recipientChainId,
            payload.toU8a()
          );

        return new ProgramConfig({
          instructions: [approvalIx, tokenBridgeTransferIx],
          signers: [messageKeypair],
          func: 'TransferWithPayload',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

export const TokenBridge = () => {
  return {
    transferNativeWithPayload,
    transferTokenWithPayload,
  };
};
