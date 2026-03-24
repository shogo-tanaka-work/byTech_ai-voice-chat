import type { LlmProvider } from "@/types/api";

export interface LlmMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LlmResult {
  content: string;
  usage: { inputTokens: number; outputTokens: number };
  durationMs: number;
}

export interface LlmStrategy {
  readonly provider: LlmProvider;
  generateResponse(
    messages: LlmMessage[],
    systemPrompt: string,
  ): Promise<LlmResult>;
}
