import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { registerWallet } from '../controllers/walletController';

export const walletRouter = Router();

walletRouter.use(authMiddleware);

walletRouter.post('/register', registerWallet);

