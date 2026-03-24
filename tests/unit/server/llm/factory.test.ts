import { describe, it, expect, vi } from "vitest";

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: vi.fn() },
    })),
  };
});

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-api-key"),
}));

import { createLlmStrategy } from "@server/lib/llm";
import { ClaudeHaikuStrategy } from "@server/lib/llm/claude-haiku";

describe("LLMファクトリ", () => {
  it("'claude-haiku'を指定したとき、ClaudeHaikuStrategyを返すこと", () => {
    const strategy = createLlmStrategy("claude-haiku");
    expect(strategy).toBeInstanceOf(ClaudeHaikuStrategy);
  });

  it("無効なプロバイダーを指定したとき、エラーをthrowすること", () => {
    expect(() => createLlmStrategy("invalid-provider" as "claude-haiku")).toThrow(
      "未対応のLLMプロバイダー: invalid-provider",
    );
  });
});
