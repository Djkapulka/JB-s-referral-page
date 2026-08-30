import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "../src/lib/referral-code";

const hashPassword = (password: string) => bcrypt.hash(password, 12);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Runs automatically after every Vercel build (see package.json "postbuild").
// In that context this must NEVER fail the deployment — it only bootstraps
// the first admin login if the seed env vars happen to be set, and skips
// cleanly otherwise. A plain local `npm run seed` still fails loudly so a
// developer notices a misconfigured .env immediately.
const isAutomatedDeploy = process.env.VERCEL === "1";

async function main() {
  await prisma.referralSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log("Referral settings ready.");

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminName = process.env.ADMIN_SEED_NAME ?? "Admin";

  if (!adminEmail || !adminPassword) {
    if (isAutomatedDeploy) {
      console.log(
        "Skipping admin bootstrap: ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD are not set yet. " +
          "Add them in Vercel's Environment Variables and redeploy to create your first admin login.",
      );
      return;
    }
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

  // Demo/sample data — local development only, never seeded in production.
  if (!isAutomatedDeploy) {
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
}

main()
  .catch((err) => {
    console.error(err);
    // Never fail an automated Vercel build over the optional admin bootstrap
    // — migrations already ran and succeeded by this point in the pipeline.
    if (!isAutomatedDeploy) {
      process.exit(1);
    }
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
