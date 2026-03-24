import { useEffect } from "react";
import { useApiSelection } from "@/hooks/useApiSelection";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChat } from "@/hooks/useChat";
import { ApiSelector } from "@/components/settings/ApiSelector";
import { MessageList } from "@/components/chat/MessageList";
import { RecordButton } from "@/components/audio/RecordButton";
import type { ChatStatus } from "@/types/chat";

const STATUS_TEXT: Record<ChatStatus, string> = {
  idle: "マイクボタンを押して話してください",
  recording: "録音中...",
  transcribing: "文字起こし中...",
  thinking: "回答生成中...",
  speaking: "読み上げ中...",
};

export function ChatContainer() {
  const {
    providers,
    loading,
    error: providerError,
    selectedStt,
    setSelectedStt,
    selectedTts,
    setSelectedTts,
    isReady,
  } = useApiSelection();

  const {
    state: recordingState,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const { play } = useAudioPlayer();

  const {
    messages,
    status: chatStatus,
    error: chatError,
    sendMessage,
    clearError,
  } = useChat();

  // 録音完了時に自動送信
  useEffect(() => {
    if (audioBlob && selectedStt && selectedTts && chatStatus === "idle") {
      void (async () => {
        await sendMessage(audioBlob, selectedStt, selectedTts);
        clearRecording();
      })();
    }
  }, [audioBlob, selectedStt, selectedTts, chatStatus, sendMessage, clearRecording]);

  // アシスタント音声の自動再生（新しいassistantメッセージが追加された時）
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.audioUrl) {
      void play(lastMessage.audioUrl);
    }
    // messagesの変化のみで発火（最後のメッセージがassistantの時だけ再生）
  }, [messages.length]);

  const isBusy = chatStatus !== "idle" && chatStatus !== "recording";
  const recordDisabled = !isReady || isBusy;

  // 録音中のステータスはrecordingStateから、それ以外はchatStatusから
  const displayStatus =
    recordingState === "recording" ? "recording" : chatStatus;

  function handleStart() {
    clearError();
    void startRecording();
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* プロバイダー選択 */}
      <div className="border-b bg-white p-3">
        <ApiSelector
          providers={providers}
          selectedStt={selectedStt}
          selectedTts={selectedTts}
          onSttChange={setSelectedStt}
          onTtsChange={setSelectedTts}
        />
      </div>

      {/* ローディング・エラー表示 */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-gray-500">プロバイダー情報を読み込み中...</p>
        </div>
      )}

      {(providerError ?? chatError) && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{providerError ?? chatError}</p>
        </div>
      )}

      {/* メッセージ一覧 */}
      <MessageList messages={messages} status={chatStatus} />

      {/* 下部コントロール */}
      <div className="flex flex-col items-center gap-2 border-t bg-white px-4 py-4">
        <RecordButton
          state={recordingState}
          disabled={recordDisabled}
          onStart={handleStart}
          onStop={stopRecording}
        />
        <p className="text-sm text-gray-500">
          {STATUS_TEXT[displayStatus]}
        </p>
      </div>
    </div>
  );
}
