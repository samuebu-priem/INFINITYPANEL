from pathlib import Path

files = [
    "frontend/src/main.jsx",
    "frontend/src/routes/index.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/context/auth.jsx",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/Register.jsx",
    "frontend/src/pages/Plans.jsx",
    "frontend/src/pages/AdminDashboard.jsx",
    "frontend/src/pages/AdminSubscribers.jsx",
    "frontend/src/pages/UserHome.jsx",
    "frontend/src/components/subscriptions/PlanCard.jsx",
    "frontend/src/components/subscriptions/CheckoutModal.jsx",
    "frontend/src/components/subscriptions/SubscriptionStatus.jsx",
    "frontend/src/components/profile/DiscordLink.jsx",
    "frontend/src/components/ui/TermsModal.jsx",
    "frontend/src/lib/terms.js",
    "frontend/src/services/api.js",
    "frontend/src/lib/storage.js",
    "frontend/src/lib/mock.js",
    "frontend/src/lib/adminAction.js",
]

for f in files:
    p = Path(f)
    print(f"\n### {f}")
    try:
        print(p.read_text(encoding="utf-8"))
    except Exception as e:
        print("ERROR:", e)
