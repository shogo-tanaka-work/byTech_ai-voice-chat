import { Hono } from "hono";
import type { SttProvider, TtsProvider } from "@/types/api";
import { LLM_PROVIDER } from "@/types/api";
import type { ChatResponse } from "@/types/chat";
import { createSttStrategy } from "@server/lib/stt/index";
import { createLlmStrategy } from "@server/lib/llm/index";
import { createTtsStrategy } from "@server/lib/tts/index";
import type { LlmMessage } from "@server/lib/llm/llm-strategy";

const MAX_CONVERSATION_TURNS = 20;
const SYSTEM_PROMPT =
  "音声チャットボットとして簡潔に日本語で応答してください。1-3文程度で回答してください。";

const chat = new Hono();

chat.post("/", async (c) => {
  const body = await c.req.parseBody();
  const audio = body["audio"];
  const sttProvider = body["sttProvider"];
  const ttsProvider = body["ttsProvider"];
  const messagesRaw = body["messages"];

  if (!(audio instanceof File)) {
    return c.json({ error: "audioフィールドが必要です" }, 400);
  }

  if (typeof sttProvider !== "string" || !sttProvider) {
    return c.json({ error: "sttProviderフィールドが必要です" }, 400);
  }

  if (typeof ttsProvider !== "string" || !ttsProvider) {
    return c.json({ error: "ttsProviderフィールドが必要です" }, 400);
  }

  // 会話履歴をパース
  let conversationHistory: LlmMessage[] = [];
  if (typeof messagesRaw === "string") {
    const parsed: unknown = JSON.parse(messagesRaw);
    if (Array.isArray(parsed)) {
      conversationHistory = parsed as LlmMessage[];
    }
  }

  // STT: 音声 → テキスト
  const sttStrategy = createSttStrategy(sttProvider as SttProvider);
  const arrayBuffer = await audio.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const sttResult = await sttStrategy.transcribe(buffer, audio.type);

  // 会話履歴を最大20ターンに制限し、新しいユーザーメッセージを追加
  const trimmedHistory = conversationHistory.slice(-MAX_CONVERSATION_TURNS);
  const llmMessages: LlmMessage[] = [
    ...trimmedHistory,
    { role: "user", content: sttResult.text },
  ];

  // LLM: テキスト → 応答テキスト
  const llmStrategy = createLlmStrategy(LLM_PROVIDER);
  const llmResult = await llmStrategy.generateResponse(
    llmMessages,
    SYSTEM_PROMPT,
  );

  // TTS: 応答テキスト → 音声
  const ttsStrategy = createTtsStrategy(ttsProvider as TtsProvider);
  const ttsResult = await ttsStrategy.synthesize({ text: llmResult.content });

  const response: ChatResponse = {
    transcript: sttResult.text,
    response: llmResult.content,
    audioBase64: ttsResult.audio.toString("base64"),
    audioMimeType: ttsResult.mimeType,
    usage: {
      stt: {
        provider: sttProvider,
        durationMs: sttResult.durationMs,
      },
      llm: {
        provider: LLM_PROVIDER,
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        durationMs: llmResult.durationMs,
      },
      tts: {
        provider: ttsProvider,
        characters: llmResult.content.length,
        durationMs: ttsResult.durationMs,
      },
    },
  };

  return c.json(response);
});

/** POST /api/chat/respond — テキスト入力からLLM+TTSのみ実行 */
chat.post("/respond", async (c) => {
  const body = await c.req.json<{
    transcript: string;
    ttsProvider: string;
    messages: LlmMessage[];
  }>();

  if (!body.transcript || typeof body.transcript !== "string") {
    return c.json({ error: "transcriptフィールドが必要です" }, 400);
  }

  if (!body.ttsProvider || typeof body.ttsProvider !== "string") {
    return c.json({ error: "ttsProviderフィールドが必要です" }, 400);
  }

  const conversationHistory = Array.isArray(body.messages)
    ? body.messages
    : [];

  const trimmedHistory = conversationHistory.slice(-MAX_CONVERSATION_TURNS);
  const llmMessages: LlmMessage[] = [
    ...trimmedHistory,
    { role: "user", content: body.transcript },
  ];

  const llmStrategy = createLlmStrategy(LLM_PROVIDER);
  const llmResult = await llmStrategy.generateResponse(
    llmMessages,
    SYSTEM_PROMPT,
  );

  const ttsStrategy = createTtsStrategy(body.ttsProvider as TtsProvider);
  const ttsResult = await ttsStrategy.synthesize({ text: llmResult.content });

  return c.json({
    response: llmResult.content,
    audioBase64: ttsResult.audio.toString("base64"),
    audioMimeType: ttsResult.mimeType,
    usage: {
      llm: {
        provider: LLM_PROVIDER,
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        durationMs: llmResult.durationMs,
      },
      tts: {
        provider: body.ttsProvider,
        characters: llmResult.content.length,
        durationMs: ttsResult.durationMs,
      },
    },
  });
});

export default chat;
