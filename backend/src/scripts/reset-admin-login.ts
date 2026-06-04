import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import prisma from '../db/prisma.js';

dotenv.config();

const username = process.env.ADMIN_RESET_USERNAME || 'admin';
const password = process.env.ADMIN_RESET_PASSWORD || 'Admin1234';

const run = async () => {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: 'ADMIN',
      active: true,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
      canCancelInvoices: true,
      canDeleteData: true,
    },
    create: {
      username,
      passwordHash,
      role: 'ADMIN',
      active: true,
      canCancelInvoices: true,
      canDeleteData: true,
    },
  });

  console.log(`Admin login is ready: ${user.username} / ${password}`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
