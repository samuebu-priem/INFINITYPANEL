import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toBillingCycle(durationDays) {
  // Clean-kit uses duration_days=30; map to MONTHLY by default.
  if (Number(durationDays) <= 7) return "WEEKLY";
  if (Number(durationDays) >= 365) return "YEARLY";
  return "MONTHLY";
}

async function main() {
  const jsonPath = path.resolve(__dirname, "../data/plans.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const plans = JSON.parse(raw);

  let created = 0;
  let updated = 0;

  for (const p of plans) {
    const data = {
      name: p.name,
      description: p.description ?? null,
      amount: p.price,
      currency: "BRL",
      billingCycle: toBillingCycle(p.duration_days ?? 30),
      isActive: Boolean(p.is_active ?? true),
      metadata: {
        source: "backend/data/plans.json",
        legacyId: p.id,
        duration_days: p.duration_days ?? 30,
        features: p.features ?? [],
      },
    };

    const existing = await prisma.subscriptionPlan.findFirst({
      where: { metadata: { path: ["legacyId"], equals: p.id } },
      select: { id: true },
    });

    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.subscriptionPlan.create({ data });
      created++;
    }
  }

  console.log(`[seed-plans] created=${created} updated=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
