import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),

  dbUrl: process.env.DATABASE_URL as string,

  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  apiSetuClientId: process.env.API_SETU_CLIENT_ID as string,
  apiSetuClientSecret: process.env.API_SETU_CLIENT_SECRET as string,
  apiSetuRedirectUri: process.env.API_SETU_REDIRECT_URI as string,
  apiSetuBaseUrl: process.env.API_SETU_BASE_URL as string,

  civicguardIssuerDid: process.env.CIVICGUARD_ISSUER_DID as string,
  civicguardPrivateKey: process.env.CIVICGUARD_PRIVATE_KEY as string,

  alchemyUrl: process.env.ALCHEMY_URL as string,
  registryContractAddress: process.env.REGISTRY_CONTRACT_ADDRESS as string,
};

