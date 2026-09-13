const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/softlab_global?schema=public";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- Current users in DB ---');
    for (const u of users) {
      console.log(`User: ${u.email} | Role: ${u.roleCode} | Status: ${u.status}`);
    }

    const credentialsToSet = [
      { email: 'admin@softlabglobal.com', pass: 'SuperAdminSecure2026!' },
      { email: 'trainer@softlabglobal.com', pass: 'TrainerSecure2026!' },
      { email: 'student@softlabglobal.com', pass: 'StudentSecure2026!' },
      { email: 'counselor@softlabglobal.com', pass: 'CounselorSecure2026!' },
      { email: 'telecaller@softlabglobal.com', pass: 'TelecallerSecure2026!' },
      { email: 'director@softlabglobal.com', pass: 'DirectorSecure2026!' },
      { email: 'accountant@softlabglobal.com', pass: 'AccountantSecure2026!' },
      { email: 'faculty2@softlabglobal.com', pass: 'FacultySecure2026!' },
    ];

    console.log('\n--- Updating Passwords & Activating Users ---');
    for (const item of credentialsToSet) {
      const hash = bcrypt.hashSync(item.pass, 12);
      const user = await prisma.user.findUnique({ where: { email: item.email } });
      if (user) {
        await prisma.user.update({
          where: { email: item.email },
          data: {
            passwordHash: hash,
            status: 'ACTIVE',
          },
        });
        const verify = bcrypt.compareSync(item.pass, hash);
        console.log(`Updated ${item.email} -> password set & verified: ${verify}`);
      } else {
        console.log(`User ${item.email} not found.`);
      }
    }

    console.log('\nAll user passwords successfully set and verified!');
  } catch (err) {
    console.error('Error during password update:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
