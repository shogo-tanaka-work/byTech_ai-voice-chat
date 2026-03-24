// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@server/lib/llm/index", () => ({
  createLlmStrategy: vi.fn(),
}));

import { createLlmStrategy } from "@server/lib/llm/index";
import llmRoute from "@server/routes/llm";

const mockedCreateLlm = vi.mocked(createLlmStrategy);

describe("POST /api/llm", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/api/llm", llmRoute);
  });

  it("LLM応答が返ること", async () => {
    const mockStrategy = {
      provider: "claude-haiku" as const,
      generateResponse: vi.fn().mockResolvedValue({
        content: "こんにちは！何かお手伝いできますか？",
        usage: { inputTokens: 50, outputTokens: 20 },
        durationMs: 800,
      }),
    };
    mockedCreateLlm.mockReturnValue(mockStrategy);

    const res = await app.request("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "こんにちは" }],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      content: "こんにちは！何かお手伝いできますか？",
      usage: { inputTokens: 50, outputTokens: 20 },
      durationMs: 800,
    });
  });

  it("messagesが未送信の場合400を返すこと", async () => {
    const res = await app.request("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
