// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@server/lib/stt/index", () => ({
  createSttStrategy: vi.fn(),
}));

import { createSttStrategy } from "@server/lib/stt/index";
import sttRoute from "@server/routes/stt";

const mockedCreateStt = vi.mocked(createSttStrategy);

describe("POST /api/stt", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/api/stt", sttRoute);
  });

  it("STT変換が動作すること", async () => {
    const mockStrategy = {
      provider: "groq-whisper" as const,
      transcribe: vi.fn().mockResolvedValue({
        text: "こんにちは",
        language: "ja",
        durationMs: 500,
      }),
    };
    mockedCreateStt.mockReturnValue(mockStrategy);

    const formData = new FormData();
    formData.append(
      "audio",
      new Blob(["fake-audio"], { type: "audio/webm" }),
      "audio.webm",
    );
    formData.append("provider", "groq-whisper");

    const res = await app.request("/api/stt", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      text: "こんにちは",
      language: "ja",
      durationMs: 500,
    });
    expect(mockedCreateStt).toHaveBeenCalledWith("groq-whisper");
  });

  it("audioが未送信の場合400を返すこと", async () => {
    const formData = new FormData();
    formData.append("provider", "groq-whisper");

    const res = await app.request("/api/stt", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(400);
  });
});
