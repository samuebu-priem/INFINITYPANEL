import { prisma } from "../src/config/prisma.js";

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
      fixedBy: "script",
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

    console.log("FIXED:", sub.id);
  }

  console.log("DONE");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });