import { Hono } from "hono";
import { LLM_PROVIDER } from "@/types/api";
import { createLlmStrategy } from "@server/lib/llm/index";
import type { LlmMessage } from "@server/lib/llm/llm-strategy";

interface LlmRequestBody {
  messages: LlmMessage[];
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT =
  "音声チャットボットとして簡潔に日本語で応答してください。1-3文程度で回答してください。";

const llm = new Hono();

llm.post("/", async (c) => {
  const body = await c.req.json<LlmRequestBody>();

  if (!body.messages || !Array.isArray(body.messages)) {
    return c.json({ error: "messagesフィールドが必要です" }, 400);
  }

  const strategy = createLlmStrategy(LLM_PROVIDER);
  const systemPrompt = body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const result = await strategy.generateResponse(body.messages, systemPrompt);

  return c.json(result);
});

export default llm;
