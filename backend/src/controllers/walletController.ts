import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { prisma } from '../config/database';

export async function registerWallet(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const { walletAddress, did } = req.body as {
    walletAddress?: string;
    did?: string;
  };

  if (!walletAddress || !did) {
    return res.status(400).json({ error: 'walletAddress and did are required' });
  }

  // Basic format checks
  if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  if (!did.startsWith('did:')) {
    return res.status(400).json({ error: 'Invalid DID format' });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      walletAddress,
      did,
    },
  });

  return res.json({ user });
}

