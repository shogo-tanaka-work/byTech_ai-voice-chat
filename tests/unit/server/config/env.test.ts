import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getRequiredEnv", () => {
    it("正常系: 設定済みの環境変数を返すこと", async () => {
      process.env.TEST_KEY = "test-value";
      const { getRequiredEnv } = await import("@server/lib/config/env");
      expect(getRequiredEnv("TEST_KEY")).toBe("test-value");
    });

    it("異常系: 未設定の環境変数でエラーを投げること", async () => {
      delete process.env.TEST_KEY;
      const { getRequiredEnv } = await import("@server/lib/config/env");
      expect(() => getRequiredEnv("TEST_KEY")).toThrow(
        "環境変数 TEST_KEY が設定されていません",
      );
    });
  });

  describe("getOptionalEnv", () => {
    it("正常系: 設定済みの環境変数を返すこと", async () => {
      process.env.OPT_KEY = "opt-value";
      const { getOptionalEnv } = await import("@server/lib/config/env");
      expect(getOptionalEnv("OPT_KEY")).toBe("opt-value");
    });

    it("正常系: 未設定の場合undefinedを返すこと", async () => {
      delete process.env.OPT_KEY;
      const { getOptionalEnv } = await import("@server/lib/config/env");
      expect(getOptionalEnv("OPT_KEY")).toBeUndefined();
    });
  });

  describe("getAvailableSttProviders", () => {
    it("正常系: APIキーが設定されたSTTプロバイダーのみ返すこと", async () => {
      process.env.GROQ_API_KEY = "groq-key";
      process.env.OPENAI_API_KEY = "openai-key";
      delete process.env.DEEPGRAM_API_KEY;
      delete process.env.GOOGLE_CLOUD_API_KEY;
      const { getAvailableSttProviders } = await import(
        "@server/lib/config/env"
      );
      const providers = getAvailableSttProviders();
      expect(providers).toHaveLength(2);
      expect(providers[0]?.id).toBe("groq-whisper");
      expect(providers[1]?.id).toBe("openai-whisper");
    });

    it("正常系: 全キー未設定なら空配列を返すこと", async () => {
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.DEEPGRAM_API_KEY;
      delete process.env.GOOGLE_CLOUD_API_KEY;
      const { getAvailableSttProviders } = await import(
        "@server/lib/config/env"
      );
      expect(getAvailableSttProviders()).toHaveLength(0);
    });
  });

  describe("getAvailableTtsProviders", () => {
    it("正常系: APIキーが設定されたTTSプロバイダーのみ返すこと", async () => {
      process.env.MINIMAX_API_KEY = "minimax-key";
      process.env.MINIMAX_GROUP_ID = "group-id";
      delete process.env.ELEVENLABS_API_KEY;
      process.env.CARTESIA_API_KEY = "cartesia-key";
      const { getAvailableTtsProviders } = await import(
        "@server/lib/config/env"
      );
      const providers = getAvailableTtsProviders();
      expect(providers).toHaveLength(2);
      expect(providers[0]?.id).toBe("minimax-speech");
      expect(providers[1]?.id).toBe("cartesia-sonic");
    });
  });

  describe("isLlmAvailable", () => {
    it("正常系: ANTHROPIC_API_KEYが設定済みならtrueを返すこと", async () => {
      process.env.ANTHROPIC_API_KEY = "anthropic-key";
      const { isLlmAvailable } = await import("@server/lib/config/env");
      expect(isLlmAvailable()).toBe(true);
    });

    it("正常系: ANTHROPIC_API_KEYが未設定ならfalseを返すこと", async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const { isLlmAvailable } = await import("@server/lib/config/env");
      expect(isLlmAvailable()).toBe(false);
    });
  });
});
