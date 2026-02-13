import { createVerifiableCredentialJwt } from 'did-jwt-vc';
import { ES256KSigner } from 'did-jwt';
import { hexToBytes } from '@noble/hashes/utils';
import { keccak256, toUtf8Bytes } from 'ethers';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { User } from '@prisma/client';
import { env } from '../config/env';

export interface IssuedCredential {
  vcJwt: string;
  credentialHash: string;
  documentHash: string; // Hash of the document (zero-knowledge)
  credentialSubject: any;
}

export class CredentialIssuanceService {
  /**
   * Hash a document for zero-knowledge storage.
   * We only store the hash, never the actual document content.
   */
  static hashDocument(doc: any): string {
    const docString = JSON.stringify(doc);
    const hash = sha256(new TextEncoder().encode(docString));
    return bytesToHex(hash);
  }

  /**
   * Issue a W3C Verifiable Credential for a DigiLocker document.
   * ZERO-KNOWLEDGE: We only store the document hash, not the full document.
   * The credentialSubject contains only the hash, proving document existence without revealing content.
   */
  static async issueFromDigiLocker(
    user: User,
    doc: any,
    credentialType: string
  ): Promise<IssuedCredential> {
    if (!env.civicguardIssuerDid || !env.civicguardPrivateKey) {
      throw new Error('CivicGuard issuer DID/private key not configured');
    }

    if (!user.did) {
      throw new Error('User DID not registered; cannot issue credential');
    }

    const issuerDid = env.civicguardIssuerDid;
    const holderDid = user.did;

    // Hash the document - we NEVER store the actual document
    const documentHash = this.hashDocument(doc);

    // Credential subject contains only the hash, not the document
    const credentialSubject = {
      id: holderDid,
      type: credentialType,
      documentHash, // Only hash stored - zero-knowledge proof
      issuedAt: new Date().toISOString(),
    };

    // Strip 0x and convert to bytes
    const privateKeyHex = env.civicguardPrivateKey.startsWith('0x')
      ? env.civicguardPrivateKey.slice(2)
      : env.civicguardPrivateKey;

    const privateKeyBytes = hexToBytes(privateKeyHex);
    const signer = ES256KSigner(privateKeyBytes);

    const now = Math.floor(Date.now() / 1000);

    const vcPayload: any = {
      sub: holderDid,
      nbf: now,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', credentialType],
        credentialSubject,
      },
    };

    const vcJwt = await createVerifiableCredentialJwt(vcPayload, {
      did: issuerDid,
      signer,
    });

    const credentialHash = keccak256(toUtf8Bytes(vcJwt));

    return {
      vcJwt,
      credentialHash,
      documentHash,
      credentialSubject,
    };
  }
}

