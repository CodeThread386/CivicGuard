import { Router } from 'express';

export const webhookRouter = Router();

webhookRouter.post('/digilocker', (_req, res) => res.json({ received: true }));

