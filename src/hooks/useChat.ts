import { useState, useCallback } from "react";
import type {
  ChatMessage,
  ChatStatus,
  ChatUsage,
  SttUsage,
} from "@/types/chat";
import type { SttProvider, TtsProvider } from "@/types/api";
import { base64ToBlob, createAudioUrl } from "@/utils/audio-encoder";

const MAX_TURNS = 20;

interface RespondResponse {
  response: string;
  audioBase64: string;
  audioMimeType: string;
  usage: {
    llm: { provider: string; inputTokens: number; outputTokens: number; durationMs: number };
    tts: { provider: string; characters: number; durationMs: number };
  };
}

interface SttResponse {
  text: string;
  language: string;
  durationMs: number;
}

interface UseChatReturn {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
  sendMessage: (
    audioBlob: Blob,
    sttProvider: SttProvider,
    ttsProvider: TtsProvider,
  ) => Promise<void>;
  clearError: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      if (updated.length > MAX_TURNS * 2) {
        return updated.slice(updated.length - MAX_TURNS * 2);
      }
      return updated;
    });
  }, []);

  const sendMessage = useCallback(
    async (
      audioBlob: Blob,
      sttProvider: SttProvider,
      ttsProvider: TtsProvider,
    ): Promise<void> => {
      try {
        setError(null);

        // Step 1: STT — 音声をテキストに変換
        setStatus("transcribing");

        const sttFormData = new FormData();
        sttFormData.append("audio", audioBlob, "recording.webm");
        sttFormData.append("provider", sttProvider);

        const sttRes = await fetch("/api/stt", {
          method: "POST",
          body: sttFormData,
        });

        if (!sttRes.ok) {
          const errText = await sttRes.text();
          throw new Error(`STTに失敗しました (${String(sttRes.status)}): ${errText}`);
        }

        const sttData = (await sttRes.json()) as SttResponse;
        const sttUsage: SttUsage = {
          provider: sttProvider,
          durationMs: sttData.durationMs,
        };

        // ユーザーメッセージを即表示
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: sttData.text,
          timestamp: Date.now(),
        };
        addMessage(userMessage);

        // Step 2: LLM + TTS — 回答生成
        setStatus("thinking");

        const historyForApi = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const respondRes = await fetch("/api/chat/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: sttData.text,
            ttsProvider,
            messages: historyForApi,
          }),
        });

        if (!respondRes.ok) {
          const errText = await respondRes.text();
          throw new Error(`回答生成に失敗しました (${String(respondRes.status)}): ${errText}`);
        }

        const respondData = (await respondRes.json()) as RespondResponse;

        // アシスタントメッセージ表示 + 音声自動再生
        setStatus("speaking");

        const audioBlob2 = base64ToBlob(
          respondData.audioBase64,
          respondData.audioMimeType,
        );
        const audioUrl = createAudioUrl(audioBlob2);

        const usage: ChatUsage = {
          stt: sttUsage,
          llm: respondData.usage.llm,
          tts: respondData.usage.tts,
        };

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: respondData.response,
          audioUrl,
          usage,
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);

        setStatus("idle");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "メッセージの送信に失敗しました";
        setError(message);
        setStatus("idle");
      }
    },
    [messages, addMessage],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { messages, status, error, sendMessage, clearError };
}
