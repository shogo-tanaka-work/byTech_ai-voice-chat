// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@server/lib/stt/index", () => ({
  createSttStrategy: vi.fn(),
}));
vi.mock("@server/lib/llm/index", () => ({
  createLlmStrategy: vi.fn(),
}));
vi.mock("@server/lib/tts/index", () => ({
  createTtsStrategy: vi.fn(),
}));

import { createSttStrategy } from "@server/lib/stt/index";
import { createLlmStrategy } from "@server/lib/llm/index";
import { createTtsStrategy } from "@server/lib/tts/index";
import chatRoute from "@server/routes/chat";

const mockedCreateStt = vi.mocked(createSttStrategy);
const mockedCreateLlm = vi.mocked(createLlmStrategy);
const mockedCreateTts = vi.mocked(createTtsStrategy);

describe("POST /api/chat", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/api/chat", chatRoute);
  });

  it("音声→テキスト→応答→音声の全パイプラインが動作すること", async () => {
    const mockStt = {
      provider: "groq-whisper" as const,
      transcribe: vi.fn().mockResolvedValue({
        text: "今日の天気は？",
        language: "ja",
        durationMs: 500,
      }),
    };
    const mockLlm = {
      provider: "claude-haiku" as const,
      generateResponse: vi.fn().mockResolvedValue({
        content: "今日は晴れです。",
        usage: { inputTokens: 100, outputTokens: 30 },
        durationMs: 1000,
      }),
    };
    const audioBuffer = Buffer.from("generated-audio");
    const mockTts = {
      provider: "minimax-speech" as const,
      synthesize: vi.fn().mockResolvedValue({
        audio: audioBuffer,
        mimeType: "audio/mpeg",
        durationMs: 400,
      }),
    };

    mockedCreateStt.mockReturnValue(mockStt);
    mockedCreateLlm.mockReturnValue(mockLlm);
    mockedCreateTts.mockReturnValue(mockTts);

    const formData = new FormData();
    formData.append(
      "audio",
      new Blob(["fake-audio"], { type: "audio/webm" }),
      "audio.webm",
    );
    formData.append("sttProvider", "groq-whisper");
    formData.append("ttsProvider", "minimax-speech");
    formData.append("messages", JSON.stringify([]));

    const res = await app.request("/api/chat", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.transcript).toBe("今日の天気は？");
    expect(body.response).toBe("今日は晴れです。");
    expect(body.audioBase64).toBe(audioBuffer.toString("base64"));
    expect(body.audioMimeType).toBe("audio/mpeg");
    expect(body.usage.stt).toEqual({
      provider: "groq-whisper",
      durationMs: 500,
    });
    expect(body.usage.llm).toEqual({
      provider: "claude-haiku",
      inputTokens: 100,
      outputTokens: 30,
      durationMs: 1000,
    });
    expect(body.usage.tts).toEqual({
      provider: "minimax-speech",
      characters: 8,
      durationMs: 400,
    });
  });

  it("会話履歴がLLMに渡されること", async () => {
    const mockStt = {
      provider: "groq-whisper" as const,
      transcribe: vi.fn().mockResolvedValue({
        text: "続きを教えて",
        language: "ja",
        durationMs: 300,
      }),
    };
    const mockLlm = {
      provider: "claude-haiku" as const,
      generateResponse: vi.fn().mockResolvedValue({
        content: "はい、続きです。",
        usage: { inputTokens: 200, outputTokens: 20 },
        durationMs: 900,
      }),
    };
    const mockTts = {
      provider: "minimax-speech" as const,
      synthesize: vi.fn().mockResolvedValue({
        audio: Buffer.from("audio"),
        mimeType: "audio/mpeg",
        durationMs: 200,
      }),
    };

    mockedCreateStt.mockReturnValue(mockStt);
    mockedCreateLlm.mockReturnValue(mockLlm);
    mockedCreateTts.mockReturnValue(mockTts);

    const messages = [
      { role: "user", content: "こんにちは" },
      { role: "assistant", content: "こんにちは！" },
    ];

    const formData = new FormData();
    formData.append(
      "audio",
      new Blob(["fake-audio"], { type: "audio/webm" }),
      "audio.webm",
    );
    formData.append("sttProvider", "groq-whisper");
    formData.append("ttsProvider", "minimax-speech");
    formData.append("messages", JSON.stringify(messages));

    await app.request("/api/chat", {
      method: "POST",
      body: formData,
    });

    const llmCallMessages = mockLlm.generateResponse.mock.calls[0]?.[0];
    expect(llmCallMessages).toHaveLength(3);
    expect(llmCallMessages?.[0]).toEqual({ role: "user", content: "こんにちは" });
    expect(llmCallMessages?.[1]).toEqual({ role: "assistant", content: "こんにちは！" });
    expect(llmCallMessages?.[2]).toEqual({ role: "user", content: "続きを教えて" });
  });

  it("audioが未送信の場合400を返すこと", async () => {
    const formData = new FormData();
    formData.append("sttProvider", "groq-whisper");
    formData.append("ttsProvider", "minimax-speech");
    formData.append("messages", "[]");

    const res = await app.request("/api/chat", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(400);
  });

  it("会話履歴が20ターンを超える場合は最新20ターンのみ使用すること", async () => {
    const mockStt = {
      provider: "groq-whisper" as const,
      transcribe: vi.fn().mockResolvedValue({
        text: "テスト",
        language: "ja",
        durationMs: 300,
      }),
    };
    const mockLlm = {
      provider: "claude-haiku" as const,
      generateResponse: vi.fn().mockResolvedValue({
        content: "応答",
        usage: { inputTokens: 50, outputTokens: 10 },
        durationMs: 500,
      }),
    };
    const mockTts = {
      provider: "minimax-speech" as const,
      synthesize: vi.fn().mockResolvedValue({
        audio: Buffer.from("audio"),
        mimeType: "audio/mpeg",
        durationMs: 200,
      }),
    };

    mockedCreateStt.mockReturnValue(mockStt);
    mockedCreateLlm.mockReturnValue(mockLlm);
    mockedCreateTts.mockReturnValue(mockTts);

    // 25ターン分の履歴を作成
    const messages = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `メッセージ${i}`,
    }));

    const formData = new FormData();
    formData.append(
      "audio",
      new Blob(["fake-audio"], { type: "audio/webm" }),
      "audio.webm",
    );
    formData.append("sttProvider", "groq-whisper");
    formData.append("ttsProvider", "minimax-speech");
    formData.append("messages", JSON.stringify(messages));

    await app.request("/api/chat", {
      method: "POST",
      body: formData,
    });

    // 最新20ターン + 新しいユーザーメッセージ = 21
    const llmCallMessages = mockLlm.generateResponse.mock.calls[0]?.[0];
    expect(llmCallMessages).toHaveLength(21);
  });
});
