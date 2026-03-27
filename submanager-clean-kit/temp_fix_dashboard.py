from pathlib import Path

p = Path("frontend/src/pages/AdminDashboard.jsx")
s = p.read_text(encoding="utf-8")

s = s.replace(
    """  const [refresh, setRefresh] = useState(0);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    async function load() {
      const [plansData, paymentsData, subscriptionsData] = await Promise.all([
        api.get(\"/api/plans\", { auth: true }),
        api.get(\"/api/payments/me\", { auth: true }),
        api.get(\"/api/subscriptions/me\", { auth: true }).catch(() => ({ subscription: null })),
      ]);

      setPlans(Array.isArray(plansData?.plans) ? plansData.plans : []);
      setPayments(Array.isArray(paymentsData?.payments) ? paymentsData.payments : []);
      setSubscriptions(subscriptionsData?.subscription ? [subscriptionsData.subscription] : []);
    }

    load().catch(() => {
      setPlans([]);
      setPayments([]);
      setSubscriptions([]);
    });
  }, [refresh]);
""",
    """  const [refresh, setRefresh] = useState(0);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  async function loadDashboard() {
    const [plansData, paymentsData, subscriptionsData] = await Promise.all([
      api.get(\"/api/plans\", { auth: true }),
      api.get(\"/api/payments/me\", { auth: true }),
      api.get(\"/api/subscriptions/me\", { auth: true }).catch(() => ({ subscription: null })),
    ]);

    setPlans(Array.isArray(plansData?.plans) ? plansData.plans : []);
    setPayments(Array.isArray(paymentsData?.payments) ? paymentsData.payments : []);
    setSubscriptions(subscriptionsData?.subscription ? [subscriptionsData.subscription] : []);
  }

  useEffect(() => {
    loadDashboard().catch(() => {
      setPlans([]);
      setPayments([]);
      setSubscriptions([]);
    });
  }, [refresh]);

  useEffect(() => {
    const onPlanChanged = () => {
      loadDashboard().catch(() => {
        setPlans([]);
        setPayments([]);
        setSubscriptions([]);
      });
    };

    window.addEventListener(\"plans:changed\", onPlanChanged);
    return () => window.removeEventListener(\"plans:changed\", onPlanChanged);
  }, []);
""",
)

s = s.replace(
    """  const forceRefresh = () => setRefresh((prev) => prev + 1);
""",
    """  const forceRefresh = () => setRefresh((prev) => prev + 1);

  function syncPlans() {
    window.dispatchEvent(new Event(\"plans:changed\"));
    forceRefresh();
  }
""",
)

s = s.replace(
    """      await deactivatePlan(plan.id);
      forceRefresh();
""",
    """      await deactivatePlan(plan.id);
      syncPlans();
""",
)

s = s.replace(
    """      await deletePlan(plan.id);
      forceRefresh();
""",
    """      await deletePlan(plan.id);
      syncPlans();
""",
)

p.write_text(s, encoding="utf-8")
