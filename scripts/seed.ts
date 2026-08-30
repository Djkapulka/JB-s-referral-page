import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "../src/lib/referral-code";

const hashPassword = (password: string) => bcrypt.hash(password, 12);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminName = process.env.ADMIN_SEED_NAME ?? "Admin";

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in your environment before seeding.",
    );
  }

  const passwordHash = await hashPassword(adminPassword);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "OWNER",
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  await prisma.referralSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log("Referral settings ready.");

  const demoCustomer = await prisma.customer.upsert({
    where: { referralCode: "DEMO-TEST1" },
    update: {},
    create: {
      firstName: "Dennis",
      lastName: "Klein",
      email: "dennis@example.com",
      phone: "5551234567",
      referralCode: "DEMO-TEST1",
    },
  });
  console.log(`Demo customer ready: /refer/${demoCustomer.referralCode}`);

  // Demonstrates the code generator too — a second, randomly-coded customer.
  const secondCustomer =
    (await prisma.customer.findFirst({ where: { email: "maria@example.com" } })) ??
    (await prisma.customer.create({
      data: {
        firstName: "Maria",
        lastName: "Gomez",
        email: "maria@example.com",
        phone: "5559876543",
        referralCode: generateReferralCode("Maria"),
      },
    }));
  console.log(`Demo customer ready: /refer/${secondCustomer.referralCode}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
