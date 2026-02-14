import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth'; // <--- Added requireAdmin
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

// <--- Added New Controller Imports
import { 
  createVerificationRequest, 
  approveRequest 
} from '../controllers/manualRequestController';

export const credentialRouter = Router();

// This applies Login Check to ALL routes below
credentialRouter.use(authMiddleware);

// --- Existing Routes ---
credentialRouter.get('/', listUserCredentials);
credentialRouter.get('/:id', getCredentialById);
credentialRouter.post('/:id/revoke', revokeCredential);
credentialRouter.get('/digilocker/docs', listDigiLockerDocs);
credentialRouter.post('/digilocker/import', importDocAsCredential);
credentialRouter.post('/demo/create', createDemoCredential);

// --- NEW MANUAL VERIFICATION ROUTES ---

// 1. Volunteer uploads a document (e.g., Degree PDF)
// url: /api/credentials/request-verification
credentialRouter.post('/request-verification', createVerificationRequest);

// 2. Admin approves the document (e.g., VIT Registrar)
// url: /api/credentials/approve-verification
credentialRouter.post('/approve-verification', requireAdmin, approveRequest);