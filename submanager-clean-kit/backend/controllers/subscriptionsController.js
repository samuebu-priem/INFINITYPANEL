import { readCollection } from "../utils/fileDb.js";

export function listSubscriptions(req, res) {
  const subscriptions = readCollection("subscriptions.json", []);
  const { email } = req.params;
  res.json(subscriptions.filter((item) => item.user_email === email));
}
