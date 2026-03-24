import type { LlmProvider } from "@/types/api";
import { LLM_PROVIDER } from "@/types/api";
import type { LlmStrategy } from "./llm-strategy";
import { ClaudeHaikuStrategy } from "./claude-haiku";

export function createLlmStrategy(provider: LlmProvider): LlmStrategy {
  if (provider !== LLM_PROVIDER) {
    throw new Error(`未対応のLLMプロバイダー: ${provider}`);
  }

  return new ClaudeHaikuStrategy();
}
