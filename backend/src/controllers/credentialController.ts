import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/database';
import { AuthedRequest } from '../middleware/auth';
import { BlockchainService } from '../services/blockchainService';

export async function listUserCredentials(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const { search, type } = req.query;

  const where: any = { userId };
  if (type && typeof type === 'string') {
    where.credentialType = type;
  }
  if (search && typeof search === 'string') {
    where.OR = [
      { credentialType: { contains: search } },
      { issuerName: { contains: search } },
    ];
  }

  const creds = await prisma.credential.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json(creds);
}

export async function getCredentialById(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  const cred = await prisma.credential.findFirst({
    where: { id, userId },
  });

  if (!cred) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Credential not found' });
  }

  res.json(cred);
}

export async function revokeCredential(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  const cred = await prisma.credential.findFirst({
    where: { id, userId },
  });

  if (!cred) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Credential not found' });
  }

  if (cred.revoked) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Credential already revoked' });
  }

  await prisma.credential.update({
    where: { id },
    data: { revoked: true },
  });

  // Record revocation on-chain
  try {
    await BlockchainService.markRevoked(cred.issuerDID, cred.credentialHash);
  } catch (err) {
    console.warn('Failed to mark revoked on-chain', err);
  }

  res.json({ success: true });
}

