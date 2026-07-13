import express from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import projectRouter from "./routes/project.routes.js";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const limiterOptions = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

let limiter = rateLimit(limiterOptions);

if (process.env.REDIS_HOST) {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
  });

  redis.on("error", (err) => {
    console.warn("Redis error:", err.message);
  });

  limiter = rateLimit({
    store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
    ...limiterOptions,
  });
}

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", limiter);
app.use("/api/home", projectRouter);

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }

  console.log(`Server running on http://localhost:${PORT}`);
});
