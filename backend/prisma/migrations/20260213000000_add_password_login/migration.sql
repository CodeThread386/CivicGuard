-- SQLite: Recreate users table with optional googleId and new passwordHash column
CREATE TABLE "users_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "picture" TEXT,
    "walletAddress" TEXT,
    "did" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "users_new" ("id", "googleId", "email", "name", "picture", "walletAddress", "did", "createdAt", "updatedAt")
SELECT "id", "googleId", "email", "name", "picture", "walletAddress", "did", "createdAt", "updatedAt" FROM "users";

DROP TABLE "users";
ALTER TABLE "users_new" RENAME TO "users";

CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");
CREATE UNIQUE INDEX "users_did_key" ON "users"("did");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");
