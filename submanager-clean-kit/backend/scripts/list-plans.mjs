/**
 * Lists subscription plans from the database.
 * Usage:
 *   node backend/scripts/list-plans.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, name: true, amount: true, currency: true, billingCycle: true, isActive: true },
    orderBy: [{ amount: "asc" }, { createdAt: "asc" }],
  });

  console.log(JSON.stringify(plans, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
