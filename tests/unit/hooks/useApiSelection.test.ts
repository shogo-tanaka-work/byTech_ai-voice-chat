import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useApiSelection } from "@/hooks/useApiSelection";
import type { ProvidersResponse } from "@/types/api";

const mockProviders: ProvidersResponse = {
  stt: [
    { id: "groq-whisper", name: "Groq Whisper Large v3" },
    { id: "openai-whisper", name: "OpenAI Whisper" },
  ],
  llm: {
    available: true,
    provider: "claude-haiku",
    name: "Claude Haiku 4.5",
  },
  tts: [
    { id: "minimax-speech", name: "MINIMAX speech-2.6-turbo" },
    { id: "elevenlabs-flash", name: "ElevenLabs Flash" },
  ],
};

describe("useApiSelection", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("プロバイダー取得が成功したとき、providersとデフォルト選択が設定されること", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProviders),
    });

    const { result } = renderHook(() => useApiSelection());

    // 初期状態はloading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.providers).toEqual(mockProviders);
    expect(result.current.selectedStt).toBe("groq-whisper");
    expect(result.current.selectedTts).toBe("minimax-speech");
    expect(result.current.error).toBeNull();
    expect(result.current.isReady).toBe(true);
  });

  it("初期選択が先頭プロバイダーになること", async () => {
    const providers: ProvidersResponse = {
      stt: [{ id: "openai-whisper", name: "OpenAI Whisper" }],
      llm: { available: true, provider: "claude-haiku", name: "Claude Haiku 4.5" },
      tts: [{ id: "elevenlabs-flash", name: "ElevenLabs Flash" }],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providers),
    });

    const { result } = renderHook(() => useApiSelection());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedStt).toBe("openai-whisper");
    expect(result.current.selectedTts).toBe("elevenlabs-flash");
  });

  it("fetchが失敗したとき、errorが設定されること", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useApiSelection());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      "プロバイダー一覧の取得に失敗しました (500)",
    );
    expect(result.current.providers).toBeNull();
    expect(result.current.isReady).toBe(false);
  });

  it("ネットワークエラーのとき、errorが設定されること", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useApiSelection());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.isReady).toBe(false);
  });

  it("LLMが利用不可のとき、isReadyがfalseになること", async () => {
    const providers: ProvidersResponse = {
      stt: [{ id: "groq-whisper", name: "Groq Whisper" }],
      llm: { available: false, provider: "claude-haiku", name: "Claude Haiku 4.5" },
      tts: [{ id: "minimax-speech", name: "MINIMAX" }],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providers),
    });

    const { result } = renderHook(() => useApiSelection());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isReady).toBe(false);
  });

  it("STTプロバイダーが空のとき、isReadyがfalseになること", async () => {
    const providers: ProvidersResponse = {
      stt: [],
      llm: { available: true, provider: "claude-haiku", name: "Claude Haiku 4.5" },
      tts: [{ id: "minimax-speech", name: "MINIMAX" }],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providers),
    });

    const { result } = renderHook(() => useApiSelection());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedStt).toBeNull();
    expect(result.current.isReady).toBe(false);
  });
});
