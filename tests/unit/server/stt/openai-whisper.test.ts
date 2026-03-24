import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("openai", () => {
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
  getRequiredEnv: vi.fn().mockReturnValue("test-openai-api-key"),
}));

import { OpenAIWhisperStrategy } from "@server/lib/stt/openai-whisper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __createMock: createMock } = await import("openai") as any;

describe("OpenAIWhisperStrategy", () => {
  let strategy: OpenAIWhisperStrategy;
  const testAudio = Buffer.from("test-audio-data");
  const testMimeType = "audio/webm";

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new OpenAIWhisperStrategy();
  });

  it("providerが'openai-whisper'であること", () => {
    expect(strategy.provider).toBe("openai-whisper");
  });

  it("音声データを送信したとき、テキスト変換結果を返すこと", async () => {
    createMock.mockResolvedValueOnce({ text: "こんにちは" });

    const result = await strategy.transcribe(testAudio, testMimeType);

    expect(result.text).toBe("こんにちは");
    expect(result.language).toBe("ja");
    expect(typeof result.durationMs).toBe("number");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-1",
        language: "ja",
      }),
    );
  });

  it("APIエラーが発生したとき、エラーをthrowすること", async () => {
    createMock.mockRejectedValueOnce(new Error("API connection failed"));

    await expect(strategy.transcribe(testAudio, testMimeType)).rejects.toThrow(
      "OpenAI Whisper STT変換に失敗しました",
    );
  });
});
