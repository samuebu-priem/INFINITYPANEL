from pathlib import Path
for p in [
    "backend/src/modules/plans/plans.controller.ts",
    "backend/src/modules/plans/plans.routes.ts",
    "backend/src/routes/index.ts",
    "backend/scripts/seed-plans.mjs",
    "backend/package.json",
    "frontend/src/pages/Plans.jsx",
    "frontend/src/components/subscriptions/PlanCard.jsx",
    "frontend/src/components/subscriptions/CheckoutModal.jsx",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/Register.jsx",
    "frontend/src/pages/AdminDashboard.jsx",
    "frontend/src/pages/AdminSubscribers.jsx",
    "frontend/src/pages/UserHome.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/routes/index.jsx",
    "frontend/src/components/subscriptions/SubscriptionStatus.jsx",
    "frontend/src/components/admin/StatCard.jsx",
    "frontend/src/components/admin/RevenueChart.jsx",
    "frontend/src/components/profile/DiscordLink.jsx",
    "frontend/src/components/ui/TermsModal.jsx",
    "frontend/src/lib/terms.js",
    "frontend/src/index.css"
]:
    print("\n### FILE:", p)
    print(Path(p).read_text(encoding="utf-8"))
