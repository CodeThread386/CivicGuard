import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { addMinutes } from 'date-fns';
import { randomBytes } from 'crypto';
import { VerificationService } from '../services/verificationService';
import { prisma } from '../config/database';
import { AuthedRequest } from '../middleware/auth';

export async function createVerification(req: Request, res: Response) {
  const { verifierDID, requestedTypes, purpose, challenge } = req.body;

  const verificationId = 'v-' + Date.now().toString(36);
  const effectiveChallenge =
    typeof challenge === 'string' && challenge.length > 0
      ? challenge
      : randomBytes(16).toString('hex');

  const record = await VerificationService.createVerificationRecord({
    verificationId,
    verifierDID,
    requestedTypes,
    purpose,
    challenge: effectiveChallenge,
    expiresAt: addMinutes(new Date(), 5),
  });

  res.json(record);
}

export async function getVerification(req: Request, res: Response) {
  const { id } = req.params;
  const v = await prisma.verification.findUnique({ where: { verificationId: id } });
  if (!v) return res.status(404).json({ error: 'Not found' });
  res.json(v);
}

export async function getVerificationHistory(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.did) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User DID not found' });
  }

  const history = await prisma.verificationHistory.findMany({
    where: { holderDID: user.did },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  res.json(history);
}

export async function getVerificationStats(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.did) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User DID not found' });
  }

  const total = await prisma.verificationHistory.count({
    where: { holderDID: user.did },
  });

  const successful = await prisma.verificationHistory.count({
    where: { holderDID: user.did, success: true },
  });

  const failed = await prisma.verificationHistory.count({
    where: { holderDID: user.did, success: false },
  });

  res.json({
    total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
  });
}

