import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getHolderTrustScore, getIssuerInfo } from '../controllers/blockchainController';

export const blockchainRouter = Router();

blockchainRouter.get('/issuer/:issuerDID', getIssuerInfo);
blockchainRouter.get('/holder/trust-score', authMiddleware, getHolderTrustScore);

