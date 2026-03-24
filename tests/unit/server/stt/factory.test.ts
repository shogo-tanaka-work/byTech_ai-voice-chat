import { describe, it, expect, vi } from "vitest";

vi.mock("groq-sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    audio: { transcriptions: { create: vi.fn() } },
  })),
}));

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    audio: { transcriptions: { create: vi.fn() } },
  })),
}));

vi.mock("@deepgram/sdk", () => ({
  createClient: vi.fn().mockReturnValue({
    listen: { prerecorded: { transcribeFile: vi.fn() } },
  }),
}));

vi.mock("@server/lib/config/env", () => ({
  getRequiredEnv: vi.fn().mockReturnValue("test-api-key"),
}));

import { createSttStrategy } from "@server/lib/stt/index";
import { GroqWhisperStrategy } from "@server/lib/stt/groq-whisper";
import { OpenAIWhisperStrategy } from "@server/lib/stt/openai-whisper";
import { DeepgramNovaStrategy } from "@server/lib/stt/deepgram-nova";
import { GoogleCloudSttStrategy } from "@server/lib/stt/google-cloud-stt";

describe("createSttStrategy", () => {
  it("'groq-whisper'を指定したとき、GroqWhisperStrategyを返すこと", () => {
    const strategy = createSttStrategy("groq-whisper");
    expect(strategy).toBeInstanceOf(GroqWhisperStrategy);
  });

  it("'openai-whisper'を指定したとき、OpenAIWhisperStrategyを返すこと", () => {
    const strategy = createSttStrategy("openai-whisper");
    expect(strategy).toBeInstanceOf(OpenAIWhisperStrategy);
  });

  it("'deepgram-nova'を指定したとき、DeepgramNovaStrategyを返すこと", () => {
    const strategy = createSttStrategy("deepgram-nova");
    expect(strategy).toBeInstanceOf(DeepgramNovaStrategy);
  });

  it("'google-cloud-stt'を指定したとき、GoogleCloudSttStrategyを返すこと", () => {
    const strategy = createSttStrategy("google-cloud-stt");
    expect(strategy).toBeInstanceOf(GoogleCloudSttStrategy);
  });

  it("不明なプロバイダーを指定したとき、エラーをthrowすること", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => createSttStrategy("unknown-provider" as any)).toThrow(
      "不明なSTTプロバイダー: unknown-provider",
    );
  });
});
