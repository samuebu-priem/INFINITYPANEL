import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "free-fire-betting-platform-api",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
