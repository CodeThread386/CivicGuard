import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { credentialRouter } from './routes/credential.routes';
import { verificationRouter, attachVerificationSockets } from './routes/verification.routes';
import { webhookRouter } from './routes/webhook.routes';
import { walletRouter } from './routes/wallet.routes';
import { blockchainRouter } from './routes/blockchain.routes';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);
app.use('/wallet', walletRouter);
app.use('/credentials', credentialRouter);
app.use('/blockchain', blockchainRouter);
app.use('/verification', verificationRouter);
app.use('/webhooks', webhookRouter);

app.use(errorHandler);

attachVerificationSockets(io);

server.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});

