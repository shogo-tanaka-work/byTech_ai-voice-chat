import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockImplementation((key: string) => {
    const envMap: Record<string, string> = {
      MINIMAX_API_KEY: "test-minimax-api-key",
      MINIMAX_GROUP_ID: "test-group-id",
    };
    return envMap[key] ?? "unknown";
  }),
}));

import { MinimaxSpeechStrategy } from "@server/lib/tts/minimax-speech";

describe("MinimaxSpeechStrategy", () => {
  let strategy: MinimaxSpeechStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new MinimaxSpeechStrategy();
  });

  it("providerが'minimax-speech'であること", () => {
    expect(strategy.provider).toBe("minimax-speech");
  });

  it("テキストを送信したとき、音声バッファを返すこと", async () => {
    const hexAudio = Buffer.from("fake-audio-data").toString("hex");
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValueOnce({
        data: { audio: hexAudio },
        extra_info: {},
        trace_id: "test-trace",
        base_resp: { status_code: 0, status_msg: "success" },
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(mockResponse));

    const result = await strategy.synthesize({ text: "こんにちは" });

    expect(result.audio).toBeInstanceOf(Buffer);
    expect(result.audio.toString()).toBe("fake-audio-data");
    expect(result.mimeType).toBe("audio/mpeg");
    expect(typeof result.durationMs).toBe("number");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.minimax.io/v1/t2a_v2?GroupId=test-group-id",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-minimax-api-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("APIエラーが発生したとき、エラーをthrowすること", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValueOnce("Internal Server Error"),
      }),
    );

    await expect(strategy.synthesize({ text: "テスト" })).rejects.toThrow(
      "MINIMAX TTS変換に失敗しました",
    );
  });
});
