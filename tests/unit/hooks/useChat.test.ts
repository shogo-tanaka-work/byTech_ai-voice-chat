import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useChat } from "@/hooks/useChat";

const mockSttResponse = {
  text: "こんにちは",
  language: "ja",
  durationMs: 500,
};

const mockRespondResponse = {
  response: "こんにちは！何かお手伝いできることはありますか？",
  audioBase64: "AAAA",
  audioMimeType: "audio/mpeg",
  usage: {
    llm: { provider: "claude-haiku", inputTokens: 10, outputTokens: 20, durationMs: 800 },
    tts: { provider: "minimax-speech", characters: 20, durationMs: 300 },
  },
};

function mockFetchSuccess() {
  return vi.fn()
    // 1st call: POST /api/stt
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSttResponse),
    })
    // 2nd call: POST /api/chat/respond
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRespondResponse),
    });
}

describe("useChat", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      ...crypto,
      randomUUID: vi.fn()
        .mockReturnValueOnce("user-uuid-1")
        .mockReturnValueOnce("assistant-uuid-1"),
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:mock-audio-url"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sendMessageが成功したとき、メッセージが2つ追加されること", async () => {
    globalThis.fetch = mockFetchSuccess();
    const { result } = renderHook(() => useChat());

    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });

    await act(async () => {
      await result.current.sendMessage(audioBlob, "groq-whisper", "minimax-speech");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]!.role).toBe("user");
    expect(result.current.messages[0]!.content).toBe("こんにちは");
    expect(result.current.messages[1]!.role).toBe("assistant");
    expect(result.current.messages[1]!.content).toBe(
      "こんにちは！何かお手伝いできることはありますか？",
    );
    expect(result.current.messages[1]!.audioUrl).toBe("blob:mock-audio-url");
    expect(result.current.status).toBe("idle");
  });

  it("STTが失敗したとき、errorが設定されること", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const { result } = renderHook(() => useChat());
    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });

    await act(async () => {
      await result.current.sendMessage(audioBlob, "groq-whisper", "minimax-speech");
    });

    expect(result.current.error).toContain("STTに失敗しました");
    expect(result.current.status).toBe("idle");
    expect(result.current.messages).toHaveLength(0);
  });

  it("最終的にstatusがidleに戻ること", async () => {
    globalThis.fetch = mockFetchSuccess();
    const { result } = renderHook(() => useChat());
    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });

    await act(async () => {
      await result.current.sendMessage(audioBlob, "groq-whisper", "minimax-speech");
    });

    expect(result.current.status).toBe("idle");
  });

  it("clearErrorが呼ばれたとき、errorがnullになること", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Error"),
    });

    const { result } = renderHook(() => useChat());
    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });

    await act(async () => {
      await result.current.sendMessage(audioBlob, "groq-whisper", "minimax-speech");
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("STT呼び出しにFormDataが正しく構築されること", async () => {
    const fetchSpy = mockFetchSuccess();
    globalThis.fetch = fetchSpy;

    const { result } = renderHook(() => useChat());
    const audioBlob = new Blob(["audio-data"], { type: "audio/webm" });

    await act(async () => {
      await result.current.sendMessage(audioBlob, "groq-whisper", "minimax-speech");
    });

    // 1st call: POST /api/stt
    expect(fetchSpy).toHaveBeenNthCalledWith(1, "/api/stt", {
      method: "POST",
      body: expect.any(FormData) as FormData,
    });

    // 2nd call: POST /api/chat/respond
    expect(fetchSpy).toHaveBeenNthCalledWith(2, "/api/chat/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String) as string,
    });
  });
});
