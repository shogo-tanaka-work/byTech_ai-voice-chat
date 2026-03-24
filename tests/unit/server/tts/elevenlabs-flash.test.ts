import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-elevenlabs-api-key"),
}));

import { ElevenLabsFlashStrategy } from "@server/lib/tts/elevenlabs-flash";

describe("ElevenLabsFlashStrategy", () => {
  let strategy: ElevenLabsFlashStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new ElevenLabsFlashStrategy();
  });

  it("providerが'elevenlabs-flash'であること", () => {
    expect(strategy.provider).toBe("elevenlabs-flash");
  });

  it("テキストを送信したとき、音声バッファを返すこと", async () => {
    const audioData = new Uint8Array([0x00, 0x01, 0x02]);
    const mockResponse = {
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValueOnce(audioData.buffer),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(mockResponse));

    const result = await strategy.synthesize({ text: "こんにちは" });

    expect(result.audio).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe("audio/mpeg");
    expect(typeof result.durationMs).toBe("number");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "xi-api-key": "test-elevenlabs-api-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("voiceIdを指定したとき、そのvoiceIdでリクエストすること", async () => {
    const audioData = new Uint8Array([0x00]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValueOnce(audioData.buffer),
      }),
    );

    await strategy.synthesize({ text: "テスト", voiceId: "custom-voice-id" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/text-to-speech/custom-voice-id",
      expect.anything(),
    );
  });

  it("APIエラーが発生したとき、エラーをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValueOnce("Unauthorized"),
      }),
    );

    await expect(strategy.synthesize({ text: "テスト" })).rejects.toThrow(
      "ElevenLabs TTS変換に失敗しました",
    );
  });
});
