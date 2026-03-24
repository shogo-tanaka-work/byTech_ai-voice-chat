import { useState, useRef, useCallback } from "react";
import type { AudioPlaybackState } from "@/types/audio";

interface UseAudioPlayerReturn {
  state: AudioPlaybackState;
  play: (audioUrl: string) => Promise<void>;
  stop: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [state, setState] = useState<AudioPlaybackState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setState("idle");
  }, []);

  const play = useCallback(
    async (audioUrl: string): Promise<void> => {
      // 既存の再生を停止
      stop();

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setState("idle");
        audioRef.current = null;
      };

      audio.onerror = () => {
        setState("idle");
        audioRef.current = null;
      };

      setState("playing");
      await audio.play();
    },
    [stop],
  );

  return { state, play, stop };
}
