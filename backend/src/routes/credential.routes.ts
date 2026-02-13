import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  importDocAsCredential,
  listDigiLockerDocs,
} from '../controllers/digilockerController';
import {
  listUserCredentials,
  getCredentialById,
  revokeCredential,
} from '../controllers/credentialController';
import { createDemoCredential } from '../controllers/demoController';

export const credentialRouter = Router();

credentialRouter.use(authMiddleware);

credentialRouter.get('/', listUserCredentials);
credentialRouter.get('/:id', getCredentialById);
credentialRouter.post('/:id/revoke', revokeCredential);
credentialRouter.get('/digilocker/docs', listDigiLockerDocs);
credentialRouter.post('/digilocker/import', importDocAsCredential);
credentialRouter.post('/demo/create', createDemoCredential);

