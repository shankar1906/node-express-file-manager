import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PERMISSION_MATRIX, ROLES } from '../src/constants/permissions';
import { hashPassword } from '../src/utils/password';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const roleMap: Record<string, string> = {};

  for (const roleName of Object.values(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap[roleName] = role.id;

    const permissions = PERMISSION_MATRIX[roleName as keyof typeof PERMISSION_MATRIX];
    for (const [module, actions] of Object.entries(permissions)) {
      for (const action of actions) {
        await prisma.permission.upsert({
          where: {
            roleId_module_action: {
              roleId: role.id,
              module,
              action,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            module,
            action,
          },
        });
      }
    }
  }

  const adminPassword = await hashPassword('123456');
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: adminPassword,
      roleId: roleMap[ROLES.SUPER_ADMIN],
    },
  });

  const demoPassword = await hashPassword('123456');
  await prisma.user.upsert({
    where: { email: 'demo@gmail.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@gmail.com',
      password: demoPassword,
      roleId: roleMap[ROLES.USER],
    },
  });

  console.log('Seed completed.');
  console.log('  Super Admin: superadmin@gmail.com / 123456');
  console.log('  Demo User:   demo@gmail.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
