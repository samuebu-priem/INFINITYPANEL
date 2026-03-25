import { readCollection, writeCollection } from "../utils/fileDb.js";

export function listPlans(_req, res) {
  const plans = readCollection("plans.json", []);
  res.json(plans);
}

export function createPlan(req, res) {
  const plans = readCollection("plans.json", []);
  const plan = { id: crypto.randomUUID(), ...req.body };
  writeCollection("plans.json", [...plans, plan]);
  res.status(201).json(plan);
}
