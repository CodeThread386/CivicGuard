import { AuthedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { Response } from 'express';

// Taanush calls this
export async function createVerificationRequest(req: AuthedRequest, res: Response) {
  const { documentUrl, docType, issuerId } = req.body; // issuerId = "VIT_VELLORE"
  
  const request = await prisma.manualVerificationRequest.create({
    data: {
      userId: req.user!.id,
      documentUrl,
      docType,
      issuerId
    }
  });

  res.json({ message: "Sent to Issuer for Verification", requestId: request.id });
}

import { CredentialIssuanceService } from '../services/credentialIssuanceService';

// VIT Admin calls this
export async function approveRequest(req: AuthedRequest, res: Response) {
  const { requestId } = req.body;
  const adminId = req.user!.id; // This should be Mr. Rao's ID

  // 1. Fetch the request
  const request = await prisma.manualVerificationRequest.findUnique({
    where: { id: requestId },
    include: { user: true }
  });

  if (!request || request.status !== 'PENDING') throw new Error("Invalid Request");

  // 2. Reuse your EXISTING issuance service (The "Common Pipeline")
  // We simulate a "doc" object similar to what DigiLocker provides
  const mockDoc = {
    docType: request.docType,
    source: "MANUAL_UPLOAD",
    url: request.documentUrl,
    verifiedBy: adminId
  };

  const issued = await CredentialIssuanceService.issueFromDigiLocker(
    request.user,
    mockDoc, // We pass our manual doc here
    request.docType
  );

  // 3. Save to Database
  await prisma.credential.create({
    data: {
      userId: request.userId,
      credentialType: request.docType,
      issuerDID: "did:ethr:0xVIT_WALLET_ADDRESS", // The Issuer's DID
      issuerName: request.issuerId, // "VIT_VELLORE"
      credentialHash: issued.credentialHash,
      issuanceDate: new Date(),
      source: 'manual_verification',
      vcJwt: issued.vcJwt,
      metadata: JSON.stringify({ documentHash: issued.documentHash })
    }
  });

  // 4. Update Request Status
  await prisma.manualVerificationRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED' }
  });

  res.json({ success: true });
}