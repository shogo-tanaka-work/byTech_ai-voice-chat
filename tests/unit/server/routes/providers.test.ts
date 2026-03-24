// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@server/lib/config/env", () => ({
  getAvailableSttProviders: vi.fn(),
  getAvailableTtsProviders: vi.fn(),
  isLlmAvailable: vi.fn(),
}));

import {
  getAvailableSttProviders,
  getAvailableTtsProviders,
  isLlmAvailable,
} from "@server/lib/config/env";
import providersRoute from "@server/routes/providers";

const mockedGetStt = vi.mocked(getAvailableSttProviders);
const mockedGetTts = vi.mocked(getAvailableTtsProviders);
const mockedIsLlm = vi.mocked(isLlmAvailable);

describe("GET /api/providers", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/api/providers", providersRoute);
  });

  it("利用可能なプロバイダーが正しく返ること", async () => {
    mockedGetStt.mockReturnValue([
      { id: "groq-whisper", name: "Groq Whisper Large v3" },
    ]);
    mockedGetTts.mockReturnValue([
      { id: "minimax-speech", name: "MINIMAX speech-2.6-turbo" },
    ]);
    mockedIsLlm.mockReturnValue(true);

    const res = await app.request("/api/providers");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      stt: [{ id: "groq-whisper", name: "Groq Whisper Large v3" }],
      llm: {
        available: true,
        provider: "claude-haiku",
        name: "Claude Haiku 4.5",
      },
      tts: [{ id: "minimax-speech", name: "MINIMAX speech-2.6-turbo" }],
    });
  });

  it("LLMが利用不可の場合 available: false を返すこと", async () => {
    mockedGetStt.mockReturnValue([]);
    mockedGetTts.mockReturnValue([]);
    mockedIsLlm.mockReturnValue(false);

    const res = await app.request("/api/providers");
    const body = await res.json();
    expect(body.llm.available).toBe(false);
  });
});
