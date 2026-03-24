export type RecordingState = "idle" | "recording" | "processing";

export type AudioPlaybackState = "idle" | "playing" | "paused";

export const MAX_RECORDING_DURATION_MS = 60_000;

export const SUPPORTED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
] as const;
