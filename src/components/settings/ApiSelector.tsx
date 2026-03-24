import type {
  ProvidersResponse,
  SttProvider,
  TtsProvider,
} from "@/types/api";

interface ApiSelectorProps {
  providers: ProvidersResponse | null;
  selectedStt: SttProvider | null;
  selectedTts: TtsProvider | null;
  onSttChange: (provider: SttProvider) => void;
  onTtsChange: (provider: TtsProvider) => void;
}

export function ApiSelector({
  providers,
  selectedStt,
  selectedTts,
  onSttChange,
  onTtsChange,
}: ApiSelectorProps) {
  const sttDisabled = !providers || providers.stt.length === 0;
  const ttsDisabled = !providers || providers.tts.length === 0;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* STT セレクター */}
      <div className="flex flex-1 flex-col gap-1">
        <label
          htmlFor="stt-select"
          className="text-xs font-medium text-gray-500"
        >
          STT（音声認識）
        </label>
        <select
          id="stt-select"
          value={selectedStt ?? ""}
          onChange={(e) => onSttChange(e.target.value as SttProvider)}
          disabled={sttDisabled}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          {sttDisabled && <option value="">利用不可</option>}
          {providers?.stt.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* LLM 固定表示 */}
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">LLM</label>
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600">
          {providers?.llm.available
            ? providers.llm.name
            : "利用不可"}
        </div>
      </div>

      {/* TTS セレクター */}
      <div className="flex flex-1 flex-col gap-1">
        <label
          htmlFor="tts-select"
          className="text-xs font-medium text-gray-500"
        >
          TTS（音声合成）
        </label>
        <select
          id="tts-select"
          value={selectedTts ?? ""}
          onChange={(e) => onTtsChange(e.target.value as TtsProvider)}
          disabled={ttsDisabled}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          {ttsDisabled && <option value="">利用不可</option>}
          {providers?.tts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
