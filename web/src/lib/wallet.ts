/**
 * In-browser wallet - generates and manages Ethereum keypair
 * Private key encrypted at rest, unlocked via WebAuthn
 */

import { ethers } from 'ethers';

export interface WalletData {
  address: string;
  did: string;
  publicKey: string;
}

export function createWallet(): { wallet: WalletData; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  const did = `did:ethr:amoy:${wallet.address}`;
  return {
    wallet: {
      address: wallet.address,
      did,
      publicKey: wallet.signingKey.compressedPublicKey,
    },
    privateKey: wallet.privateKey,
  };
}

export function walletFromPrivateKey(privateKey: string): WalletData {
  const wallet = new ethers.Wallet(privateKey);
  return {
    address: wallet.address,
    did: `did:ethr:amoy:${wallet.address}`,
    publicKey: wallet.signingKey.compressedPublicKey,
  };
}

export async function signMessage(privateKey: string, message: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signMessage(message);
}
