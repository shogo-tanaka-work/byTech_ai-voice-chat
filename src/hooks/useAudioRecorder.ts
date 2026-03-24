import { useState, useRef, useCallback } from "react";
import type { RecordingState } from "@/types/audio";
import { MAX_RECORDING_DURATION_MS } from "@/types/audio";
import { getSupportedMimeType } from "@/utils/audio-encoder";

interface UseAudioRecorderReturn {
  state: RecordingState;
  audioBlob: Blob | null;
  mimeType: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mimeType = getSupportedMimeType();

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      setAudioBlob(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setState("processing");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // メディアストリームのトラックを停止
        for (const track of stream.getTracks()) {
          track.stop();
        }

        setState("idle");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setState("recording");

      // 最大録音時間で自動停止
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_DURATION_MS);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "マイクへのアクセスに失敗しました";
      throw new Error(message);
    }
  }, [mimeType, stopRecording]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    chunksRef.current = [];
  }, []);

  return {
    state,
    audioBlob,
    mimeType,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
