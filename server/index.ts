import { config } from "dotenv";
config();

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler";
import providersRoute from "./routes/providers";
import chatRoute from "./routes/chat";
import sttRoute from "./routes/stt";
import llmRoute from "./routes/llm";
import ttsRoute from "./routes/tts";

const app = new Hono();

app.use("*", logger());
app.use("/api/*", cors());
app.use("/api/*", errorHandler);

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api/providers", providersRoute);
app.route("/api/chat", chatRoute);
app.route("/api/stt", sttRoute);
app.route("/api/llm", llmRoute);
app.route("/api/tts", ttsRoute);

export default app;
