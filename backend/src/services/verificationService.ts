import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';
import { verifyPresentation } from 'did-jwt-vc';
import { prisma } from '../config/database';
import { env } from '../config/env';

const resolver = new Resolver(
  getResolver({
    networks: [
      {
        name: 'mumbai',
        rpcUrl: env.alchemyUrl,
      },
    ],
  })
);

export class VerificationService {
  static async verifyPresentationJwt(vpJwt: string, expectedChallenge: string) {
    const result = await verifyPresentation(vpJwt, resolver, {
      challenge: expectedChallenge,
    });

    // Extract verified credential types from the presentation
    const verifiedTypes: string[] = [];
    const notVerifiedTypes: string[] = [];

    if (result.verifiablePresentation?.verifiableCredential) {
      const vcs = Array.isArray(result.verifiablePresentation.verifiableCredential)
        ? result.verifiablePresentation.verifiableCredential
        : [result.verifiablePresentation.verifiableCredential];

      // Extract credential types from VCs
      vcs.forEach((vc: any) => {
        if (vc.type && Array.isArray(vc.type)) {
          const credentialType = vc.type.find((t: string) => t !== 'VerifiableCredential');
          if (credentialType) {
            verifiedTypes.push(credentialType);
          }
        }
      });
    }

    return {
      ...result,
      verifiedTypes,
      notVerifiedTypes, // Will be populated by comparing with requested types
    };
  }

  static async createVerificationRecord(params: {
    verificationId: string;
    holderDID?: string;
    verifierDID?: string;
    requestedTypes: string[];
    purpose?: string;
    challenge: string;
    expiresAt: Date;
  }) {
    return prisma.verification.create({
      data: {
        verificationId: params.verificationId,
        holderDID: params.holderDID,
        verifierDID: params.verifierDID,
        requestedTypes: JSON.stringify(params.requestedTypes), // Store as JSON string
        purpose: params.purpose,
        challenge: params.challenge,
        expiresAt: params.expiresAt,
      },
    });
  }

  static async saveVerificationResult(params: {
    verificationId: string;
    success: boolean;
    result: any;
  }) {
    const status = params.success ? 'completed' : 'failed';

    const verification = await prisma.verification.update({
      where: { verificationId: params.verificationId },
      data: {
        status,
        result: JSON.stringify(params.result),
        completedAt: new Date(),
      },
    });

    // Save to verification history
    if (verification.holderDID) {
      const requestedTypes = typeof verification.requestedTypes === 'string'
        ? JSON.parse(verification.requestedTypes)
        : verification.requestedTypes;

      await prisma.verificationHistory.create({
        data: {
          verificationId: params.verificationId,
          holderDID: verification.holderDID,
          verifierDID: verification.verifierDID || null,
          credentialTypes: JSON.stringify(requestedTypes),
          success: params.success,
        },
      });
    }

    return verification;
  }
}

