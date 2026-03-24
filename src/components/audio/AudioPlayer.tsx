import { useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl: string | undefined;
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  if (!audioUrl) return null;

  function handleToggle() {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  }

  function handleEnded() {
    setPlaying(false);
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300"
        aria-label={playing ? "一時停止" : "再生"}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        preload="auto"
      />
    </div>
  );
}
