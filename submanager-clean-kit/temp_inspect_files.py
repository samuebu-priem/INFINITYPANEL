from pathlib import Path

files = [
    "frontend/src/services/api.js",
    "frontend/src/lib/adminAction.js",
    "frontend/src/lib/storage.js",
    "frontend/src/pages/Plans.jsx",
    "frontend/src/pages/AdminDashboard.jsx",
    "frontend/src/pages/AdminSubscribers.jsx",
    "frontend/src/routes/index.jsx",
    "frontend/src/components/subscriptions/PlanCard.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "backend/routes/plansRoutes.js",
    "backend/controllers/plansController.js",
    "backend/server.js",
]

for f in files:
    print(f"### {f} ###\n{Path(f).read_text(encoding='utf-8')}\n")
