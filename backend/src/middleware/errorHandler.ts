import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}

