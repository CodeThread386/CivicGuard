import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyJwt } from '../utils/jwt';

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Missing token' });
  }

  try {
    const token = header.slice(7);
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' });
  }
}

// backend/src/middleware/auth.ts

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  // Simple check: Is the user's email authorized?
  // In a real app, check a database role or specific admin emails
  const adminEmails = ["admin@vit.ac.in", "gov@india.gov.in"]; // Add your testing email here
  
  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(StatusCodes.FORBIDDEN).json({ error: "Admin access required" });
  }
  
  next();
}