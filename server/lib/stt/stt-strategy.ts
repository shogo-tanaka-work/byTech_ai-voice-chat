import type { SttProvider } from "@/types/api";

export interface SttResult {
  text: string;
  language: string;
  durationMs: number;
}

export interface SttStrategy {
  readonly provider: SttProvider;
  transcribe(audio: Buffer, mimeType: string): Promise<SttResult>;
}
