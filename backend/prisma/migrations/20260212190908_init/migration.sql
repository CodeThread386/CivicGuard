-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "walletAddress" TEXT,
    "did" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "issuerDID" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "issuanceDate" DATETIME NOT NULL,
    "expirationDate" DATETIME,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "vcJwt" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verificationId" TEXT NOT NULL,
    "verifierDID" TEXT,
    "holderDID" TEXT,
    "holderId" TEXT,
    "requestedTypes" TEXT NOT NULL,
    "purpose" TEXT,
    "challenge" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "verifications_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "issuer_metadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issuerDID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "totalIssued" INTEGER NOT NULL DEFAULT 0,
    "totalRevoked" INTEGER NOT NULL DEFAULT 0,
    "lastSynced" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "digilocker_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "digilocker_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verificationId" TEXT NOT NULL,
    "holderDID" TEXT NOT NULL,
    "verifierDID" TEXT,
    "credentialTypes" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_did_key" ON "users"("did");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_credentialHash_key" ON "credentials"("credentialHash");

-- CreateIndex
CREATE INDEX "credentials_userId_idx" ON "credentials"("userId");

-- CreateIndex
CREATE INDEX "credentials_credentialType_idx" ON "credentials"("credentialType");

-- CreateIndex
CREATE INDEX "credentials_issuerDID_idx" ON "credentials"("issuerDID");

-- CreateIndex
CREATE INDEX "credentials_revoked_idx" ON "credentials"("revoked");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_verificationId_key" ON "verifications"("verificationId");

-- CreateIndex
CREATE INDEX "verifications_verificationId_idx" ON "verifications"("verificationId");

-- CreateIndex
CREATE INDEX "verifications_holderDID_idx" ON "verifications"("holderDID");

-- CreateIndex
CREATE INDEX "verifications_status_idx" ON "verifications"("status");

-- CreateIndex
CREATE INDEX "verifications_expiresAt_idx" ON "verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "issuer_metadata_issuerDID_key" ON "issuer_metadata"("issuerDID");

-- CreateIndex
CREATE INDEX "issuer_metadata_issuerDID_idx" ON "issuer_metadata"("issuerDID");

-- CreateIndex
CREATE INDEX "issuer_metadata_isActive_idx" ON "issuer_metadata"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "digilocker_tokens_userId_key" ON "digilocker_tokens"("userId");

-- CreateIndex
CREATE INDEX "digilocker_tokens_userId_idx" ON "digilocker_tokens"("userId");

-- CreateIndex
CREATE INDEX "digilocker_tokens_expiresAt_idx" ON "digilocker_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "verification_history_holderDID_idx" ON "verification_history"("holderDID");

-- CreateIndex
CREATE INDEX "verification_history_timestamp_idx" ON "verification_history"("timestamp");
