import { useState, useEffect } from "react";
import type {
  ProvidersResponse,
  SttProvider,
  TtsProvider,
} from "@/types/api";

interface UseApiSelectionReturn {
  providers: ProvidersResponse | null;
  loading: boolean;
  error: string | null;
  selectedStt: SttProvider | null;
  setSelectedStt: (provider: SttProvider) => void;
  selectedTts: TtsProvider | null;
  setSelectedTts: (provider: TtsProvider) => void;
  isReady: boolean;
}

export function useApiSelection(): UseApiSelectionReturn {
  const [providers, setProviders] = useState<ProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStt, setSelectedStt] = useState<SttProvider | null>(null);
  const [selectedTts, setSelectedTts] = useState<TtsProvider | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProviders(): Promise<void> {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/providers");
        if (!response.ok) {
          throw new Error(
            `プロバイダー一覧の取得に失敗しました (${String(response.status)})`,
          );
        }

        const data = (await response.json()) as ProvidersResponse;
        if (cancelled) return;

        setProviders(data);

        const firstStt = data.stt[0];
        if (firstStt) {
          setSelectedStt(firstStt.id as SttProvider);
        }
        const firstTts = data.tts[0];
        if (firstTts) {
          setSelectedTts(firstTts.id as TtsProvider);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "プロバイダー一覧の取得に失敗しました";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProviders();

    return () => {
      cancelled = true;
    };
  }, []);

  const isReady =
    providers !== null &&
    selectedStt !== null &&
    selectedTts !== null &&
    providers.stt.length > 0 &&
    providers.tts.length > 0 &&
    providers.llm.available;

  return {
    providers,
    loading,
    error,
    selectedStt,
    setSelectedStt,
    selectedTts,
    setSelectedTts,
    isReady,
  };
}
