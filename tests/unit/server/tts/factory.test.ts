import { describe, it, expect, vi } from "vitest";

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-api-key"),
}));

import { createTtsStrategy } from "@server/lib/tts";
import { MinimaxSpeechStrategy } from "@server/lib/tts/minimax-speech";
import { ElevenLabsFlashStrategy } from "@server/lib/tts/elevenlabs-flash";
import { CartesiaSonicStrategy } from "@server/lib/tts/cartesia-sonic";

describe("TTSファクトリ", () => {
  it("'minimax-speech'を指定したとき、MinimaxSpeechStrategyを返すこと", () => {
    const strategy = createTtsStrategy("minimax-speech");
    expect(strategy).toBeInstanceOf(MinimaxSpeechStrategy);
  });

  it("'elevenlabs-flash'を指定したとき、ElevenLabsFlashStrategyを返すこと", () => {
    const strategy = createTtsStrategy("elevenlabs-flash");
    expect(strategy).toBeInstanceOf(ElevenLabsFlashStrategy);
  });

  it("'cartesia-sonic'を指定したとき、CartesiaSonicStrategyを返すこと", () => {
    const strategy = createTtsStrategy("cartesia-sonic");
    expect(strategy).toBeInstanceOf(CartesiaSonicStrategy);
  });

  it("無効なプロバイダーを指定したとき、エラーをthrowすること", () => {
    expect(() =>
      createTtsStrategy("invalid-provider" as "minimax-speech"),
    ).toThrow("未対応のTTSプロバイダー: invalid-provider");
  });
});
