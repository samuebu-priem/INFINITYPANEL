import http from "http";

import { env } from "./src/config/env.js";
import { app } from "./src/app.js";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});