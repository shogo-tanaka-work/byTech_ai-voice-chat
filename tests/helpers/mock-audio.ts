/**
 * 最小のWAVファイルバイナリを生成する（テスト用）
 * 44バイトヘッダー + 2バイトの無音データ
 */
export function createMockWavBuffer(): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = 2;
  const fileSize = 36 + dataSize;

  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(16000, 24); // sample rate
  header.writeUInt32LE(32000, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  const data = Buffer.alloc(dataSize, 0);
  return Buffer.concat([header, data]);
}

/**
 * テスト用のFormDataに使える最小音声Blobを生成
 */
export function createMockAudioBlob(): Blob {
  const buffer = createMockWavBuffer();
  return new Blob([new Uint8Array(buffer)], { type: "audio/wav" });
}
