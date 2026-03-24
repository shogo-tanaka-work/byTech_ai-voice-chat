import { Hono } from "hono";
import type { ProvidersResponse } from "@/types/api";
import {
  getAvailableSttProviders,
  getAvailableTtsProviders,
  isLlmAvailable,
} from "@server/lib/config/env";

const providers = new Hono();

providers.get("/", (c) => {
  const response: ProvidersResponse = {
    stt: getAvailableSttProviders(),
    llm: {
      available: isLlmAvailable(),
      provider: "claude-haiku",
      name: "Claude Haiku 4.5",
    },
    tts: getAvailableTtsProviders(),
  };

  return c.json(response);
});

export default providers;
