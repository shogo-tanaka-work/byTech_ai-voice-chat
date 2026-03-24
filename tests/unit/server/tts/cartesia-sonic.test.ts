import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-cartesia-api-key"),
}));

import { CartesiaSonicStrategy } from "@server/lib/tts/cartesia-sonic";

describe("CartesiaSonicStrategy", () => {
  let strategy: CartesiaSonicStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new CartesiaSonicStrategy();
  });

  it("providerが'cartesia-sonic'であること", () => {
    expect(strategy.provider).toBe("cartesia-sonic");
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
      "https://api.cartesia.ai/tts/bytes",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-API-Key": "test-cartesia-api-key",
          "Cartesia-Version": "2024-06-10",
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

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
    const callBody = JSON.parse(
      (calls[0]?.[1] as RequestInit).body as string,
    );
    expect(callBody.voice.id).toBe("custom-voice-id");
  });

  it("デフォルトvoiceIdが設定されていること", async () => {
    const audioData = new Uint8Array([0x00]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValueOnce(audioData.buffer),
      }),
    );

    await strategy.synthesize({ text: "テスト" });

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
    const callBody = JSON.parse(
      (calls[0]?.[1] as RequestInit).body as string,
    );
    expect(callBody.voice.id).toBe("a0e99841-438c-4a64-b679-ae501e7d6091");
  });

  it("APIエラーが発生したとき、エラーをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValueOnce("Server Error"),
      }),
    );

    await expect(strategy.synthesize({ text: "テスト" })).rejects.toThrow(
      "Cartesia TTS変換に失敗しました",
    );
  });
});
