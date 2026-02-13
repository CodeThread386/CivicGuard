import axios from 'axios';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { addMinutes } from 'date-fns';

export class DigiLockerService {
  static getAuthUrl(state: string) {
    const url =
      `${env.apiSetuBaseUrl}/authorize?` +
      `response_type=code&client_id=${encodeURIComponent(env.apiSetuClientId)}` +
      `&redirect_uri=${encodeURIComponent(env.apiSetuRedirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=openid`;

    return url;
  }

  static async exchangeCodeForToken(code: string) {
    const res = await axios.post(
      `${env.apiSetuBaseUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.apiSetuRedirectUri,
        client_id: env.apiSetuClientId,
        client_secret: env.apiSetuClientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return res.data as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
    };
  }

  static async saveToken(
    userId: string,
    tokenData: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }
  ) {
    const expiresAt = addMinutes(new Date(), tokenData.expires_in / 60);
    await prisma.digiLockerToken.upsert({
      where: { userId },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      },
      create: {
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      },
    });
  }

  static async refreshAccessToken(userId: string) {
    const token = await prisma.digiLockerToken.findUnique({ where: { userId } });
    if (!token || !token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const res = await axios.post(
      `${env.apiSetuBaseUrl}/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: env.apiSetuClientId,
        client_secret: env.apiSetuClientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokenData = res.data as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
    };

    await this.saveToken(userId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || token.refreshToken,
      expires_in: tokenData.expires_in,
    });

    return tokenData.access_token;
  }

  static async getUserDocs(userId: string) {
    let token = await prisma.digiLockerToken.findUnique({ where: { userId } });
    if (!token) throw new Error('No DigiLocker connection');

    // Check if token is expired and refresh if needed
    if (token.expiresAt < new Date()) {
      const newAccessToken = await this.refreshAccessToken(userId);
      token = await prisma.digiLockerToken.findUnique({ where: { userId } });
      if (!token) throw new Error('Failed to refresh token');
    }

    const res = await axios.get(`${env.apiSetuBaseUrl}/issued-docs`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });

    return res.data;
  }

  static async fetchDoc(userId: string, docId: string) {
    const token = await prisma.digiLockerToken.findUnique({ where: { userId } });
    if (!token) throw new Error('No DigiLocker connection');

    const res = await axios.get(
      `${env.apiSetuBaseUrl}/issued-docs/${encodeURIComponent(docId)}`,
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    );

    return res.data;
  }
}

