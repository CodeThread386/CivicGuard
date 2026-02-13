import { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { authMiddleware } from '../middleware/auth';
import {
  createVerification,
  getVerification,
  getVerificationHistory,
  getVerificationStats,
} from '../controllers/verificationController';
import { VerificationService } from '../services/verificationService';

export const verificationRouter = Router();

verificationRouter.post('/', createVerification);
verificationRouter.get('/:id', getVerification);
verificationRouter.get('/history/all', authMiddleware, getVerificationHistory);
verificationRouter.get('/history/stats', authMiddleware, getVerificationStats);

export function attachVerificationSockets(io: SocketIOServer) {
  io.on('connection', (socket) => {
    socket.on('join-verification', (verificationId: string) => {
      socket.join(verificationId);
    });

    socket.on('verification-response', async (payload: {
      verificationId: string;
      presentation: string;
      timestamp: number;
    }) => {
      const { verificationId, presentation } = payload;
      try {
        const verification = await ioFetchVerification(verificationId);
        if (!verification) {
          io.to(verificationId).emit('verification-result', {
            success: false,
            message: 'Verification not found',
          });
          return;
        }

        const result = await VerificationService.verifyPresentationJwt(
          presentation,
          verification.challenge
        );

        // Determine which requested types were verified vs not verified
        const requestedTypes = Array.isArray(verification.requestedTypes)
          ? verification.requestedTypes
          : JSON.parse(verification.requestedTypes || '[]');

        const verifiedTypes = result.verifiedTypes || [];
        const notVerifiedTypes = requestedTypes.filter(
          (type: string) => !verifiedTypes.includes(type)
        );

        const enhancedResult = {
          ...result,
          requestedTypes,
          verifiedTypes,
          notVerifiedTypes,
        };

        await VerificationService.saveVerificationResult({
          verificationId,
          success: true,
          result: enhancedResult,
        });

        io.to(verificationId).emit('verification-result', {
          success: true,
          message: 'Presentation verified',
          details: enhancedResult,
        });
      } catch (e: any) {
        await VerificationService.saveVerificationResult({
          verificationId,
          success: false,
          result: { error: e?.message || 'Verification failed' },
        });
        io.to(verificationId).emit('verification-result', {
          success: false,
          message: 'Verification failed',
        });
      }
    });
  });
}

async function ioFetchVerification(verificationId: string) {
  const { prisma } = await import('../config/database');
  return prisma.verification.findUnique({ where: { verificationId } });
}

