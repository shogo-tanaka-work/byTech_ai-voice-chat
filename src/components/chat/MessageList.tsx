import { useEffect, useRef } from "react";
import type { ChatMessage, ChatStatus } from "@/types/chat";
import { MessageBubble } from "@/components/chat/MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  status: ChatStatus;
}

const THINKING_LABELS: Partial<Record<ChatStatus, string>> = {
  thinking: "回答生成中",
  speaking: "読み上げ中",
};

export function MessageList({ messages, status }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const thinkingLabel = THINKING_LABELS[status];

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.length === 0 && !thinkingLabel && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400">
            メッセージはまだありません
          </p>
        </div>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {thinkingLabel && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 shadow-sm">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
            </div>
            <span className="text-sm text-gray-500">{thinkingLabel}...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
