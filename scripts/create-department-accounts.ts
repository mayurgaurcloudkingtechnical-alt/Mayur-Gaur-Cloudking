import { db } from "../src/server/db/client";
import * as bcrypt from "bcryptjs";
import { UserRoleCode, UserStatus } from "@prisma/client";

async function main() {
  console.log("==> Provisioning Departmental & Executive Accounts...");

  const defaultPassword = "SoftLab@2026!";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const accounts = [
    {
      email: "admin@softlabglobal.com",
      roleCode: UserRoleCode.SUPER_ADMIN,
      firstName: "Super",
      lastName: "Administrator",
      phone: "9196596971",
      title: "Root System Administrator"
    },
    {
      email: "director@softlabglobal.com",
      roleCode: UserRoleCode.DIRECTOR,
      firstName: "Executive",
      lastName: "Director",
      phone: "9196596972",
      title: "Executive Director & Institute Head"
    },
    {
      email: "it.admin@softlabglobal.com",
      roleCode: UserRoleCode.ADMIN,
      firstName: "IT",
      lastName: "Administrator",
      phone: "9196596973",
      title: "IT & Systems Administrator"
    },
    {
      email: "accounts@softlabglobal.com",
      roleCode: UserRoleCode.ACCOUNTANT,
      firstName: "Finance",
      lastName: "Officer",
      phone: "9196596974",
      title: "Accounts & Financial Ledger Manager"
    },
    {
      email: "sales@softlabglobal.com",
      roleCode: UserRoleCode.COUNSELOR,
      firstName: "Admissions",
      lastName: "Counselor",
      phone: "9196596975",
      title: "Academic Admissions & Career Counselor"
    },
    {
      email: "hr@softlabglobal.com",
      roleCode: UserRoleCode.HR,
      firstName: "HR",
      lastName: "Manager",
      phone: "9196596976",
      title: "Human Resources & Faculty Operations"
    },
    {
      email: "support@softlabglobal.com",
      roleCode: UserRoleCode.TELECALLER,
      firstName: "Student",
      lastName: "Support",
      phone: "9196596977",
      title: "Student Helpdesk & Technical Support"
    }
  ];

  for (const acc of accounts) {
    const role = await db.role.findUnique({
      where: { code: acc.roleCode }
    });
    if (!role) {
      console.log(`Role ${acc.roleCode} not found in DB!`);
      continue;
    }

    const existingUser = await db.user.findUnique({
      where: { email: acc.email }
    });

    if (existingUser) {
      await db.user.update({
        where: { email: acc.email },
        data: {
          roleCode: acc.roleCode,
          firstName: acc.firstName,
          lastName: acc.lastName,
          passwordHash,
          status: UserStatus.ACTIVE,
          phone: acc.phone
        }
      });
      console.log(`✓ Updated user: ${acc.email} (${acc.roleCode})`);
    } else {
      await db.user.create({
        data: {
          email: acc.email,
          roleCode: acc.roleCode,
          firstName: acc.firstName,
          lastName: acc.lastName,
          passwordHash,
          status: UserStatus.ACTIVE,
          phone: acc.phone
        }
      });
      console.log(`✓ Created user: ${acc.email} (${acc.roleCode})`);
    }
  }

  console.log("==> All departmental accounts provisioned successfully!");
}

main()
  .catch((e) => {
    console.error("Error provisioning accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
