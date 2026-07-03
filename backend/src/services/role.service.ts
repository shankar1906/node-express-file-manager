import { prisma } from '../config/database';

export class RoleService {
  async listRoles() {
    return prisma.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRoleById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }
}

export const roleService = new RoleService();
