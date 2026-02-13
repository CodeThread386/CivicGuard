import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '../services/authService';
import { AuthedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'email and password required' });
  }
  if (password.length < 6) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const result = await AuthService.register(email, password, name);
    res.status(StatusCodes.CREATED).json(result);
  } catch (e: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: e.message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'email and password required' });
  }

  try {
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: e.message });
  }
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'refreshToken required' });
  }

  try {
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error: any) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: error.message });
  }
}

export async function logout(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  await AuthService.logout(userId);
  res.json({ success: true });
}

