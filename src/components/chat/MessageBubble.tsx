import type { ChatMessage } from "@/types/chat";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { UsageBadge } from "@/components/chat/UsageBadge";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
        {message.audioUrl && <AudioPlayer audioUrl={message.audioUrl} />}
        {message.usage && <UsageBadge usage={message.usage} />}
      </div>
    </div>
  );
}
