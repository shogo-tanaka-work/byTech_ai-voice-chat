import { Hono } from "hono";
import type { TtsProvider } from "@/types/api";
import { createTtsStrategy } from "@server/lib/tts/index";

interface TtsRequestBody {
  text: string;
  provider: string;
  voiceId?: string;
}

const tts = new Hono();

tts.post("/", async (c) => {
  const body = await c.req.json<TtsRequestBody>();

  if (!body.text || typeof body.text !== "string") {
    return c.json({ error: "textフィールドが必要です" }, 400);
  }

  if (!body.provider || typeof body.provider !== "string") {
    return c.json({ error: "providerフィールドが必要です" }, 400);
  }

  const strategy = createTtsStrategy(body.provider as TtsProvider);
  const result = await strategy.synthesize({
    text: body.text,
    voiceId: body.voiceId,
  });

  return new Response(new Uint8Array(result.audio), {
    status: 200,
    headers: {
      "Content-Type": result.mimeType,
    },
  });
});

export default tts;
