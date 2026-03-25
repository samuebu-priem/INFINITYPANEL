export const defaultPlans = [
  {
    id: "plan-basic",
    name: "Básico",
    price: 29.9,
    duration_days: 30,
    is_active: true,
    description: "Ideal para começar com acesso básico.",
    features: ["Acesso principal", "Suporte por e-mail", "Renovação mensal"],
  },
  {
    id: "plan-pro",
    name: "Pro",
    price: 59.9,
    duration_days: 30,
    is_active: true,
    description: "Plano com mais benefícios e prioridade.",
    features: ["Tudo do Básico", "Acesso prioritário", "Suporte rápido"],
  },
  {
    id: "plan-premium",
    name: "Premium",
    price: 99.9,
    duration_days: 30,
    is_active: true,
    description: "Experiência completa para clientes premium.",
    features: ["Tudo do Pro", "Suporte VIP", "Recursos exclusivos"],
  },
];

export const defaultConfigs = [
  { key: "app_title", value: "SubManager" },
  { key: "hero_title", value: "Infinity Apostas" },
  {
    key: "hero_subtitle",
    value: "Infinity Apostas",
  },
  { key: "highlight_1", value: "Ativação imediata" },
  { key: "highlight_2", value: "Controle total" },
  { key: "highlight_3", value: "Pronto para escalar" },
];

export const defaultUsers = [
  {
    id: "admin-1",
    full_name: "Administrador",
    email: "admin@local.test",
    role: "admin",
    discord_id: null,
    password: "123456",
  },
  {
    id: "user-1",
    full_name: "Cliente Teste",
    email: "cliente@local.test",
    role: "client",
    discord_id: null,
    password: "123456",
  },
];
