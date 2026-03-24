import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("groq-sdk", () => {
  const createMock = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: createMock,
        },
      },
    })),
    __createMock: createMock,
  };
});

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-groq-api-key"),
}));

import { GroqWhisperStrategy } from "@server/lib/stt/groq-whisper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __createMock: createMock } = await import("groq-sdk") as any;

describe("GroqWhisperStrategy", () => {
  let strategy: GroqWhisperStrategy;
  const testAudio = Buffer.from("test-audio-data");
  const testMimeType = "audio/webm";

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new GroqWhisperStrategy();
  });

  it("providerが'groq-whisper'であること", () => {
    expect(strategy.provider).toBe("groq-whisper");
  });

  it("音声データを送信したとき、テキスト変換結果を返すこと", async () => {
    createMock.mockResolvedValueOnce({ text: "こんにちは" });

    const result = await strategy.transcribe(testAudio, testMimeType);

    expect(result.text).toBe("こんにちは");
    expect(result.language).toBe("ja");
    expect(typeof result.durationMs).toBe("number");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-large-v3",
        language: "ja",
      }),
    );
  });

  it("APIエラーが発生したとき、エラーをthrowすること", async () => {
    createMock.mockRejectedValueOnce(new Error("API connection failed"));

    await expect(strategy.transcribe(testAudio, testMimeType)).rejects.toThrow(
      "Groq Whisper STT変換に失敗しました",
    );
  });
});
