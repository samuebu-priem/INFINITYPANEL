import { readCollection, writeCollection } from "../utils/fileDb.js";

export function listPayments(_req, res) {
  const payments = readCollection("payments.json", []);
  res.json(payments);
}

export function createCheckout(req, res) {
  const { user_email, user_name, plan_id, plan_name, amount, payment_method, duration_days = 30 } = req.body;
  const now = new Date();
  const payments = readCollection("payments.json", []);
  const subscriptions = readCollection("subscriptions.json", []);

  const payment = {
    id: crypto.randomUUID(),
    user_email,
    plan_id,
    plan_name,
    amount,
    payment_method,
    status: "pending",
    created_date: now.toISOString(),
  };

  const subscription = {
    id: crypto.randomUUID(),
    user_email,
    user_name,
    plan_id,
    plan_name,
    start_date: now.toISOString(),
    end_date: new Date(now.getTime() + Number(duration_days) * 86400000).toISOString(),
    status: "pending",
    payment_status: "pending",
    amount_paid: amount,
    created_date: now.toISOString(),
  };

  writeCollection("payments.json", [...payments, payment]);
  writeCollection("subscriptions.json", [...subscriptions, subscription]);

  res.status(201).json({
    message: "Checkout criado. Aqui você vai integrar o gateway real.",
    payment,
    subscription,
  });
}

export function webhookMercadoPago(req, res) {
  const payments = readCollection("payments.json", []);
  const subscriptions = readCollection("subscriptions.json", []);
  const { payment_id, status = "approved" } = req.body;

  const updatedPayments = payments.map((item) =>
    item.id === payment_id ? { ...item, status: status === "approved" ? "completed" : status } : item
  );

  const payment = updatedPayments.find((item) => item.id === payment_id);

  let updatedSubscriptions = subscriptions;
  if (payment) {
    updatedSubscriptions = subscriptions.map((item) =>
      item.plan_id === payment.plan_id && item.user_email === payment.user_email
        ? { ...item, status: "active", payment_status: "paid" }
        : item
    );
  }

  writeCollection("payments.json", updatedPayments);
  writeCollection("subscriptions.json", updatedSubscriptions);
  res.json({ received: true });
}
