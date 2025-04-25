import {
  mplTokenMetadata,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey as pubk } from '@metaplex-foundation/umi';

const RPC = 'https://wispy-palpable-market.solana-mainnet.quiknode.pro';

export async function printSpaMeta(mint: string) {
  const umi = createUmi(RPC).use(mplTokenMetadata());

  const metadataPda = findMetadataPda(umi, {
    mint: pubk(mint),
  });

  const metadataAccount = await umi.rpc.getAccount(metadataPda[0]);

  console.log('Metadata PDA:', metadataPda.toString());
  console.log(metadataPda);
  console.log('Account data length (bytes):', metadataAccount['data'].length);
  console.log(metadataAccount);
}
