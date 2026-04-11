import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function resolvePlanDurationDays(plan) {
  const metadata =
    plan?.metadata && typeof plan.metadata === "object"
      ? plan.metadata
      : {};

  const candidates = [
    Number(metadata.validityDays),
    Number(metadata.days),
    Number(metadata.durationDays),
  ];

  const customDays = candidates.find(
    (v) => Number.isFinite(v) && v > 0
  );

  if (customDays) return Math.floor(customDays);

  if (plan.billingCycle === "WEEKLY") return 7;
  if (plan.billingCycle === "MONTHLY") return 30;
  return 365;
}

async function main() {
  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: true },
  });

  let updated = 0;

  for (const sub of subs) {
    const durationDays = resolvePlanDurationDays(sub.plan);

    const baseDate =
      sub.startsAt ?? sub.approvedAt ?? sub.createdAt;

    if (!baseDate) continue;

    const nextEndsAt = new Date(baseDate);
    nextEndsAt.setDate(nextEndsAt.getDate() + durationDays);

    const currentMetadata =
      sub.metadata && typeof sub.metadata === "object"
        ? sub.metadata
        : {};

    const newMetadata = {
      ...currentMetadata,
      fixedBy: "fix-active-subscriptions-validity",
      durationDaysApplied: durationDays,
      fixedAt: new Date().toISOString(),
    };

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        endsAt: nextEndsAt,
        metadata: newMetadata,
      },
    });

    updated += 1;
    console.log("FIXED:", sub.id, "->", nextEndsAt.toISOString());
  }

  console.log(`DONE: ${updated} subscriptions updated`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("SCRIPT ERROR:", err);
    await prisma.$disconnect();
    process.exit(1);
  });