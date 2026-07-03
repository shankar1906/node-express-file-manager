import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';

export class UserService {
  async listUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createUser(data: { name: string; email: string; password: string; roleId: string }) {
    const hashed = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        roleId: data.roleId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
  }

  async updateUser(
    id: string,
    data: Partial<{ name: string; email: string; password: string; roleId: string }>
  ) {
    const updateData: Record<string, string> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.roleId) updateData.roleId = data.roleId;
    if (data.password) updateData.password = await hashPassword(data.password);

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
  }
}

export const userService = new UserService();
