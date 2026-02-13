import { Router } from 'express';
import { register, login, refreshToken, logout } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import {
  connectDigiLocker,
  digilockerCallback,
} from '../controllers/digilockerController';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refreshToken);
authRouter.post('/logout', authMiddleware, logout);
authRouter.get('/digilocker/connect', connectDigiLocker);
authRouter.get('/digilocker/callback', digilockerCallback);

