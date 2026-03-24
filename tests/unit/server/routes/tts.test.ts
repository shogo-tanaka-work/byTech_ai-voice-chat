// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@server/lib/tts/index", () => ({
  createTtsStrategy: vi.fn(),
}));

import { createTtsStrategy } from "@server/lib/tts/index";
import ttsRoute from "@server/routes/tts";

const mockedCreateTts = vi.mocked(createTtsStrategy);

describe("POST /api/tts", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/api/tts", ttsRoute);
  });

  it("TTS音声が返ること", async () => {
    const audioBuffer = Buffer.from("fake-audio-data");
    const mockStrategy = {
      provider: "minimax-speech" as const,
      synthesize: vi.fn().mockResolvedValue({
        audio: audioBuffer,
        mimeType: "audio/mpeg",
        durationMs: 300,
      }),
    };
    mockedCreateTts.mockReturnValue(mockStrategy);

    const res = await app.request("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "こんにちは",
        provider: "minimax-speech",
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");

    const responseBuffer = await res.arrayBuffer();
    expect(Buffer.from(responseBuffer)).toEqual(audioBuffer);
  });

  it("textが未送信の場合400を返すこと", async () => {
    const res = await app.request("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "minimax-speech" }),
    });

    expect(res.status).toBe(400);
  });
});
