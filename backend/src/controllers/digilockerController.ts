import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DigiLockerService } from '../services/digilockerService';
import { AuthedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { CredentialIssuanceService } from '../services/credentialIssuanceService';
import { BlockchainService } from '../services/blockchainService';

export async function connectDigiLocker(req: Request, res: Response) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(StatusCodes.BAD_REQUEST).send('userId required');
  }

  const authUrl = DigiLockerService.getAuthUrl(userId);
  res.redirect(authUrl);
}

export async function digilockerCallback(req: Request, res: Response) {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(StatusCodes.BAD_REQUEST).send('Missing code/state');
  }

  const tokenData = await DigiLockerService.exchangeCodeForToken(String(code));
  await DigiLockerService.saveToken(String(state), tokenData);

  res.send('<html><body><h2>DigiLocker connected. You can close this window.</h2></body></html>');
}

export async function listDigiLockerDocs(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const docs = await DigiLockerService.getUserDocs(userId);
  res.json(docs);
}

export async function importDocAsCredential(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const { docId, credentialType } = req.body;
  if (!docId || !credentialType) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: 'docId and credentialType required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User not found' });
  }

  const doc = await DigiLockerService.fetchDoc(userId, docId);

  // Issue a verifiable credential - ZERO-KNOWLEDGE: only document hash is stored
  const issued = await CredentialIssuanceService.issueFromDigiLocker(
    user,
    doc,
    credentialType
  );

  // Store only the hash, never the actual document
  const credential = await prisma.credential.create({
    data: {
      userId,
      credentialType,
      issuerDID: process.env.CIVICGUARD_ISSUER_DID!,
      issuerName: 'CivicGuard DigiLocker Bridge',
      credentialHash: issued.credentialHash,
      issuanceDate: new Date(),
      source: 'digilocker',
      vcJwt: issued.vcJwt,
      // Metadata contains only documentHash, not the actual document
      metadata: JSON.stringify({
        documentHash: issued.documentHash,
        credentialType,
        issuedAt: issued.credentialSubject.issuedAt,
      }),
    },
  });

  // Optionally record issuance on-chain if registry and keys are configured
  try {
    await BlockchainService.markIssued(process.env.CIVICGUARD_ISSUER_DID!, issued.credentialHash);
  } catch (err) {
    // Log but do not fail the API if on-chain write fails
    console.warn('Failed to mark issued on-chain', err);
  }

  res.json(credential);
}

