import { ethers } from 'ethers';
import { prisma } from '../config/database';
import { env } from '../config/env';

const REGISTRY_ABI = [
  'function getIssuer(string issuerDID) view returns (string name,string domain,uint8 trustScore,bool isActive,bool isVerified,uint256 totalIssued,uint256 totalRevoked)',
  'function markIssued(string issuerDID, bytes32 credentialHash)',
  'function markRevoked(string issuerDID, bytes32 credentialHash)',
];

export interface IssuerOnChainInfo {
  issuerDID: string;
  name: string;
  domain: string;
  trustScore: number;
  isActive: boolean;
  isVerified: boolean;
  totalIssued: number;
  totalRevoked: number;
}

export class BlockchainService {
  private static getProvider() {
    if (!env.alchemyUrl) {
      throw new Error('ALCHEMY_URL not configured');
    }
    return new ethers.JsonRpcProvider(env.alchemyUrl);
  }

  private static getReadContract() {
    if (!env.registryContractAddress) {
      throw new Error('REGISTRY_CONTRACT_ADDRESS not configured');
    }
    const provider = this.getProvider();
    return new ethers.Contract(env.registryContractAddress, REGISTRY_ABI, provider);
  }

  private static getWriteContract() {
    if (!env.registryContractAddress) {
      throw new Error('REGISTRY_CONTRACT_ADDRESS not configured');
    }
    if (!env.civicguardPrivateKey) {
      throw new Error('CIVICGUARD_PRIVATE_KEY not configured for on-chain writes');
    }
    const provider = this.getProvider();
    const wallet = new ethers.Wallet(env.civicguardPrivateKey, provider);
    return new ethers.Contract(env.registryContractAddress, REGISTRY_ABI, wallet);
  }

  static async getIssuer(issuerDID: string): Promise<IssuerOnChainInfo> {
    const contract = this.getReadContract();
    const [name, domain, trustScore, isActive, isVerified, totalIssued, totalRevoked] =
      await contract.getIssuer(issuerDID);

    const info: IssuerOnChainInfo = {
      issuerDID,
      name,
      domain,
      trustScore: Number(trustScore),
      isActive,
      isVerified,
      totalIssued: Number(totalIssued),
      totalRevoked: Number(totalRevoked),
    };

    await prisma.issuerMetadata.upsert({
      where: { issuerDID },
      update: {
        name: info.name,
        domain: info.domain,
        trustScore: info.trustScore,
        isActive: info.isActive,
        isVerified: info.isVerified,
        totalIssued: info.totalIssued,
        totalRevoked: info.totalRevoked,
        lastSynced: new Date(),
      },
      create: {
        issuerDID,
        name: info.name,
        domain: info.domain,
        trustScore: info.trustScore,
        isActive: info.isActive,
        isVerified: info.isVerified,
        totalIssued: info.totalIssued,
        totalRevoked: info.totalRevoked,
      },
    });

    return info;
  }

  static async markIssued(issuerDID: string, credentialHash: string) {
    const contract = this.getWriteContract();
    const tx = await contract.markIssued(issuerDID, credentialHash);
    await tx.wait();
  }

  static async markRevoked(issuerDID: string, credentialHash: string) {
    const contract = this.getWriteContract();
    const tx = await contract.markRevoked(issuerDID, credentialHash);
    await tx.wait();
  }
}

