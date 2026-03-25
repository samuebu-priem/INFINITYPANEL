import { readCollection } from "../utils/fileDb.js";

export function login(req, res) {
  const { email, password } = req.body;
  const users = readCollection("users.json", []);
  const user = users.find((item) => item.email === email && item.password === password);

  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  return res.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
    token: "demo-token",
  });
}
