import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-google-api-key"),
}));

import { GoogleCloudSttStrategy } from "@server/lib/stt/google-cloud-stt";

describe("GoogleCloudSttStrategy", () => {
  let strategy: GoogleCloudSttStrategy;
  const testAudio = Buffer.from("test-audio-data");
  const testMimeType = "audio/webm";

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new GoogleCloudSttStrategy();
  });

  it("providerが'google-cloud-stt'であること", () => {
    expect(strategy.provider).toBe("google-cloud-stt");
  });

  it("音声データを送信したとき、テキスト変換結果を返すこと", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            alternatives: [{ transcript: "こんにちは" }],
          },
        ],
      }),
    });

    const result = await strategy.transcribe(testAudio, testMimeType);

    expect(result.text).toBe("こんにちは");
    expect(result.language).toBe("ja");
    expect(typeof result.durationMs).toBe("number");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://speech.googleapis.com/v1/speech:recognize",
      ),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("APIがエラーレスポンスを返したとき、エラーをthrowすること", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    await expect(strategy.transcribe(testAudio, testMimeType)).rejects.toThrow(
      "Google Cloud STT変換に失敗しました",
    );
  });

  it("ネットワークエラーが発生したとき、エラーをthrowすること", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    await expect(strategy.transcribe(testAudio, testMimeType)).rejects.toThrow(
      "Google Cloud STT変換に失敗しました",
    );
  });
});
