import { prisma } from '../config/database';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import type { JwtPayload } from '../types/auth';

import { isValidUuid } from '../utils/uuid';

export class AuthService {
  async login(email: string, password: string, remember = false) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    if (remember) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleId: user.roleId,
      },
    };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    if (!isValidUuid(payload.userId)) {
      throw new Error('Session expired. Please log in again.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.refreshToken && user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const newPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    };

    return {
      accessToken: signAccessToken(newPayload),
      refreshToken: signRefreshToken(newPayload),
    };
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}

export const authService = new AuthService();

export { hashPassword };
