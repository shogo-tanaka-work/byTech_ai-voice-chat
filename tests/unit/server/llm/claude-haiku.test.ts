import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: createMock,
      },
    })),
  };
});

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-anthropic-api-key"),
}));

import { ClaudeHaikuStrategy } from "@server/lib/llm/claude-haiku";
import type { LlmMessage } from "@server/lib/llm/llm-strategy";

describe("ClaudeHaikuStrategy", () => {
  let strategy: ClaudeHaikuStrategy;
  const testMessages: LlmMessage[] = [
    { role: "user", content: "こんにちは" },
  ];
  const testSystemPrompt = "あなたはAIアシスタントです。";

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new ClaudeHaikuStrategy();
  });

  it("providerが'claude-haiku'であること", () => {
    expect(strategy.provider).toBe("claude-haiku");
  });

  it("メッセージを送信したとき、応答テキストとusageを返すこと", async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: "text", text: "こんにちは！お手伝いできることはありますか？" }],
      usage: { input_tokens: 15, output_tokens: 20 },
    });

    const result = await strategy.generateResponse(testMessages, testSystemPrompt);

    expect(result.content).toBe("こんにちは！お手伝いできることはありますか？");
    expect(result.usage.inputTokens).toBe(15);
    expect(result.usage.outputTokens).toBe(20);
    expect(typeof result.durationMs).toBe("number");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: testSystemPrompt,
        messages: [{ role: "user", content: "こんにちは" }],
      }),
    );
  });

  it("APIエラーが発生したとき、エラーをthrowすること", async () => {
    createMock.mockRejectedValueOnce(new Error("API connection failed"));

    await expect(
      strategy.generateResponse(testMessages, testSystemPrompt),
    ).rejects.toThrow("Claude Haiku LLM応答生成に失敗しました");
  });
});
