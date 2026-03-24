import { SUPPORTED_MIME_TYPES } from "@/types/audio";

/**
 * ブラウザがサポートする音声MIMEタイプを取得する
 */
export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }
  for (const mimeType of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "audio/webm";
}

/**
 * Base64文字列をBlobに変換する
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mimeType });
}

/**
 * BlobからObject URLを作成する
 */
export function createAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Object URLを解放する
 */
export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}
