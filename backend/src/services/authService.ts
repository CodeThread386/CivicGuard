import { prisma } from '../config/database';
import { signJwt, signRefreshToken, verifyJwt } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';

export class AuthService {
  static async register(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        name: name?.trim() || null,
      },
    });

    const accessToken = signJwt({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      token: accessToken,
      refreshToken,
    };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new Error('This account uses a different sign-in method');
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = signJwt({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      token: accessToken,
      refreshToken,
    };
  }

  static async refreshAccessToken(refreshToken: string) {
    try {
      const payload = verifyJwt(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });

      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = signJwt({ sub: user.id, email: user.email });
      return { token: newAccessToken };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(userId: string) {
    return { success: true };
  }
}
