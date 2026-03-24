import { Hono } from "hono";
import type { SttProvider } from "@/types/api";
import { createSttStrategy } from "@server/lib/stt/index";

const stt = new Hono();

stt.post("/", async (c) => {
  const body = await c.req.parseBody();
  const audio = body["audio"];
  const provider = body["provider"];

  if (!(audio instanceof File)) {
    return c.json({ error: "audioフィールドが必要です" }, 400);
  }

  if (typeof provider !== "string" || !provider) {
    return c.json({ error: "providerフィールドが必要です" }, 400);
  }

  const strategy = createSttStrategy(provider as SttProvider);
  const arrayBuffer = await audio.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const result = await strategy.transcribe(buffer, audio.type);

  return c.json(result);
});

export default stt;
