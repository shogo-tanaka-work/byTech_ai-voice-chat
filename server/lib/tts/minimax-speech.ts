import type { TtsProvider } from "@/types/api";
import { getRequiredEnv } from "@server/lib/config/env";
import type { TtsOptions, TtsResult, TtsStrategy } from "./tts-strategy";

interface MinimaxResponse {
  data: {
    audio: string;
  };
  extra_info: Record<string, unknown>;
  trace_id: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

export class MinimaxSpeechStrategy implements TtsStrategy {
  readonly provider: TtsProvider = "minimax-speech";
  private readonly apiKey: string;
  private readonly groupId: string;

  constructor() {
    this.apiKey = getRequiredEnv("MINIMAX_API_KEY");
    this.groupId = getRequiredEnv("MINIMAX_GROUP_ID");
  }

  async synthesize(options: TtsOptions): Promise<TtsResult> {
    const start = performance.now();
    const url = `https://api.minimax.io/v1/t2a_v2?GroupId=${this.groupId}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "speech-02-turbo",
          text: options.text,
          timber_weights: [
            {
              voice_id:
                options.voiceId ?? "male-qn-qingse",
              weight: 1,
            },
          ],
          audio_setting: { format: "mp3" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText}`,
        );
      }

      const json = (await response.json()) as MinimaxResponse;

      if (json.base_resp.status_code !== 0) {
        throw new Error(
          `MINIMAX API エラー: ${json.base_resp.status_msg}`,
        );
      }

      const audio = Buffer.from(json.data.audio, "hex");
      const durationMs = performance.now() - start;

      return {
        audio,
        mimeType: "audio/mpeg",
        durationMs,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`MINIMAX TTS変換に失敗しました: ${message}`);
    }
  }
}
