import { describe, it, expect, vi, beforeEach } from "vitest";

const { transcribeFileMock } = vi.hoisted(() => ({
  transcribeFileMock: vi.fn(),
}));

vi.mock("@deepgram/sdk", () => ({
  createClient: vi.fn().mockReturnValue({
    listen: {
      prerecorded: {
        transcribeFile: transcribeFileMock,
      },
    },
  }),
}));

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-deepgram-api-key"),
}));

import { DeepgramNovaStrategy } from "@server/lib/stt/deepgram-nova";

describe("DeepgramNovaStrategy", () => {
  let strategy: DeepgramNovaStrategy;
  const testAudio = Buffer.from("test-audio-data");
  const testMimeType = "audio/webm";

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new DeepgramNovaStrategy();
  });

  it("providerが'deepgram-nova'であること", () => {
    expect(strategy.provider).toBe("deepgram-nova");
  });

  it("音声データを送信したとき、テキスト変換結果を返すこと", async () => {
    transcribeFileMock.mockResolvedValueOnce({
      result: {
        results: {
          channels: [
            {
              alternatives: [{ transcript: "こんにちは" }],
            },
          ],
        },
      },
    });

    const result = await strategy.transcribe(testAudio, testMimeType);

    expect(result.text).toBe("こんにちは");
    expect(result.language).toBe("ja");
    expect(typeof result.durationMs).toBe("number");
    expect(transcribeFileMock).toHaveBeenCalledWith(
      testAudio,
      expect.objectContaining({
        model: "nova-3",
        language: "ja",
      }),
    );
  });

  it("APIエラーが発生したとき、エラーをthrowすること", async () => {
    transcribeFileMock.mockRejectedValueOnce(
      new Error("API connection failed"),
    );

    await expect(
      strategy.transcribe(testAudio, testMimeType),
    ).rejects.toThrow("Deepgram Nova STT変換に失敗しました");
  });
});
