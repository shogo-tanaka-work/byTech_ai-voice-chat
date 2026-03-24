import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider } from "@/types/api";
import { getRequiredEnv } from "@server/lib/config/env";
import type { LlmMessage, LlmResult, LlmStrategy } from "./llm-strategy";

export class ClaudeHaikuStrategy implements LlmStrategy {
  readonly provider: LlmProvider = "claude-haiku";
  private readonly client: Anthropic;

  constructor() {
    const apiKey = getRequiredEnv("ANTHROPIC_API_KEY");
    this.client = new Anthropic({ apiKey });
  }

  async generateResponse(
    messages: LlmMessage[],
    systemPrompt: string,
  ): Promise<LlmResult> {
    const start = performance.now();

    try {
      const response = await this.client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      });

      const firstBlock = response.content[0];
      if (!firstBlock || firstBlock.type !== "text") {
        throw new Error("応答にテキストブロックが含まれていません");
      }

      const durationMs = performance.now() - start;

      return {
        content: firstBlock.text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        durationMs,
      };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "応答にテキストブロックが含まれていません"
      ) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`Claude Haiku LLM応答生成に失敗しました: ${message}`);
    }
  }
}
