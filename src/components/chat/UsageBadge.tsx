import type { ChatUsage } from "@/types/chat";

interface UsageBadgeProps {
  usage: ChatUsage;
}

/**
 * 各APIの料金概算（参考値）
 */
function estimateCost(usage: ChatUsage): {
  stt: number;
  llm: number;
  tts: number;
  total: number;
} {
  // STT: $0.006/分 = $0.0001/秒（Groq Whisper基準）
  const sttCost = (usage.stt.durationMs / 1000 / 60) * 0.006;

  // LLM: Claude Haiku — input $0.80/1M, output $4.00/1M tokens
  const llmCost =
    (usage.llm.inputTokens / 1_000_000) * 0.8 +
    (usage.llm.outputTokens / 1_000_000) * 4.0;

  // TTS: MINIMAX基準 $60/1M文字 = $0.00006/文字
  const ttsCost = usage.tts.characters * 0.00006;

  return {
    stt: sttCost,
    llm: llmCost,
    tts: ttsCost,
    total: sttCost + llmCost + ttsCost,
  };
}

function formatCost(usd: number): string {
  if (usd < 0.0001) return "<$0.0001";
  return `$${usd.toFixed(4)}`;
}

function formatJpy(usd: number): string {
  const jpy = usd * 150;
  if (jpy < 0.01) return "<0.01円";
  return `${jpy.toFixed(2)}円`;
}

export function UsageBadge({ usage }: UsageBadgeProps) {
  const cost = estimateCost(usage);

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
      <div className="mb-1.5 font-medium text-gray-600">API使用量</div>
      <div className="grid grid-cols-3 gap-2">
        {/* STT */}
        <div className="rounded bg-white p-2">
          <div className="mb-1 font-medium text-blue-600">STT</div>
          <div>{usage.stt.provider}</div>
          <div>{(usage.stt.durationMs / 1000).toFixed(1)}s</div>
          <div className="mt-1 font-mono">{formatCost(cost.stt)}</div>
        </div>

        {/* LLM */}
        <div className="rounded bg-white p-2">
          <div className="mb-1 font-medium text-purple-600">LLM</div>
          <div>{usage.llm.provider}</div>
          <div>
            {usage.llm.inputTokens}+{usage.llm.outputTokens} tok
          </div>
          <div>{(usage.llm.durationMs / 1000).toFixed(1)}s</div>
          <div className="mt-1 font-mono">{formatCost(cost.llm)}</div>
        </div>

        {/* TTS */}
        <div className="rounded bg-white p-2">
          <div className="mb-1 font-medium text-green-600">TTS</div>
          <div>{usage.tts.provider}</div>
          <div>{usage.tts.characters}文字</div>
          <div>{(usage.tts.durationMs / 1000).toFixed(1)}s</div>
          <div className="mt-1 font-mono">{formatCost(cost.tts)}</div>
        </div>
      </div>

      {/* 合計 */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
        <span className="font-medium text-gray-600">合計コスト（概算）</span>
        <span className="font-mono font-medium text-gray-800">
          {formatCost(cost.total)} ({formatJpy(cost.total)})
        </span>
      </div>
    </div>
  );
}
