import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { CredentialIssuanceService } from '../services/credentialIssuanceService';
import { BlockchainService } from '../services/blockchainService';

/**
 * Create a demo credential without DigiLocker
 * This is for testing/demo purposes only
 */
export async function createDemoCredential(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const { credentialType } = req.body;

  if (!credentialType) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'credentialType required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.did) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'User DID not found. Please create wallet first.'
    });
  }

  // Create mock document (for demo only)
  const mockDoc = {
    type: credentialType,
    demo: true,
    issuedDate: new Date().toISOString(),
    issuer: 'Demo Issuer',
    description: `Demo ${credentialType} credential for testing`,
  };

  try {
    const issued = await CredentialIssuanceService.issueFromDigiLocker(
      user,
      mockDoc,
      credentialType
    );

    const credential = await prisma.credential.create({
      data: {
        userId,
        credentialType,
        issuerDID: process.env.CIVICGUARD_ISSUER_DID!,
        issuerName: 'CivicGuard Demo',
        credentialHash: issued.credentialHash,
        issuanceDate: new Date(),
        source: 'demo',
        vcJwt: issued.vcJwt,
        metadata: JSON.stringify({
          documentHash: issued.documentHash,
          credentialType,
          issuedAt: issued.credentialSubject.issuedAt,
        }),
      },
    });

    // Optionally record on-chain (will fail silently if not configured)
    try {
      await BlockchainService.markIssued(
        process.env.CIVICGUARD_ISSUER_DID!,
        issued.credentialHash
      );
    } catch (err) {
      console.warn('Failed to mark issued on-chain (this is okay for demo)', err);
    }

    res.json(credential);
  } catch (error: any) {
    console.error('Failed to create demo credential:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to create demo credential',
      message: error.message,
    });
  }
}
