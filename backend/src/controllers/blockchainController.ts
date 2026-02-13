import { Request, Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { BlockchainService } from '../services/blockchainService';

export async function getIssuerInfo(req: Request, res: Response) {
  const { issuerDID } = req.params;
  if (!issuerDID) {
    return res.status(400).json({ error: 'issuerDID is required' });
  }

  const info = await BlockchainService.getIssuer(issuerDID);
  return res.json(info);
}

export async function getHolderTrustScore(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;

  const credentials = await prisma.credential.findMany({
    where: { userId, revoked: false },
    select: { issuerDID: true },
  });

  if (credentials.length === 0) {
    return res.json({ score: 0, issuers: [] });
  }

  const uniqueIssuers = Array.from(new Set(credentials.map((c) => c.issuerDID)));

  const issuerInfos = await Promise.all(
    uniqueIssuers.map((issuerDID) => BlockchainService.getIssuer(issuerDID))
  );

  const activeIssuers = issuerInfos.filter((i) => i.isActive);

  if (activeIssuers.length === 0) {
    return res.json({ score: 0, issuers: issuerInfos });
  }

  const score =
    activeIssuers.reduce((sum, i) => sum + i.trustScore, 0) / activeIssuers.length;

  return res.json({
    score: Math.round(score),
    issuers: issuerInfos,
  });
}

