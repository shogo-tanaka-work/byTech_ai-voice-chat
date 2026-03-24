import type { TtsProvider } from "@/types/api";

export interface TtsOptions {
  text: string;
  voiceId?: string;
}

export interface TtsResult {
  audio: Buffer;
  mimeType: string;
  durationMs: number;
}

export interface TtsStrategy {
  readonly provider: TtsProvider;
  synthesize(options: TtsOptions): Promise<TtsResult>;
}
