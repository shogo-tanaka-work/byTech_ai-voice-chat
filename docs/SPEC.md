# AI Voice Chat MVP仕様

作成日: 2026-03-24
バージョン: 0.1

## 目的（1行で書く）
音声でAIチャットボットと対話できるWebアプリを作る（STT → LLM → TTS パイプライン、各API切り替え可能）

## 対象ユーザー
- 音声チャットボットの技術検証を行う社内開発者・企画者

## 技術スタック
- フロントエンド: React 19 + Vite
- UIライブラリ: shadcn/ui + Tailwind CSS
- バックエンド: Hono (@hono/node-server)
- 統合: @hono/vite-dev-server（開発時HMR統合）
- DB: なし（セッション情報はサーバーメモリ管理）
- 認証: なし（APIキーは環境変数管理）
- デプロイ: Docker (Node.js 22 Alpine)
- テスト: Vitest + React Testing Library
- リンター: ESLint + Prettier
- パッケージマネージャ: pnpm

## アーキテクチャ概要

Pattern D（STT → LLM → TTS パイプライン）を採用。各レイヤーをStrategy Patternで抽象化し、プルダウンでAPIを切り替え可能にする。

```
マイク → [STT] → テキスト → [LLM] → 応答テキスト → [TTS] → スピーカー
           ↑                    ↑                       ↑
       4社切替可          Claude固定             3社切替可
```

## 対応API一覧

### STT（音声 → テキスト）— 4社

| API | 料金 | 速度 | 特徴 |
|-----|------|------|------|
| Groq Whisper Large v3 | $0.006/分 | 超高速（通常の10倍） | コスパ最強 |
| OpenAI Whisper | $0.006/分 | 標準 | 安定性高い |
| Deepgram Nova-3 | $0.0043/分 | リアルタイム特化 | ストリーミング向き |
| Google Cloud STT | $0.006/分 | 標準 | 日本語精度◎ |

### LLM — Claude API固定

| API | 料金（入力/出力 per 1M tokens） | 特徴 |
|-----|------|------|
| Claude Haiku 4.5 | $0.80 / $4.00 | 高速・安価 |

※ MVPではClaude APIのみ。LLMの切り替え機能はv2以降で検討。

### TTS（テキスト → 音声）— 3社

| API | 料金 | レイテンシ | 特徴 |
|-----|------|------|------|
| MINIMAX speech-2.6-turbo | $60/1M文字 | <250ms | 既使用。品質◎。WebSocket対応 |
| ElevenLabs Flash | $100+/1M文字 | <400ms | 音質最高。声クローン可 |
| Cartesia Sonic-3 | ~$50/1M文字 | 40〜90ms | 業界最速 |

### コスト試算（1ターン）

```
STT（30秒発話）:  $0.003
LLM（500 tokens）: $0.0004
TTS（200文字）:   $0.000012
──────────────────────────
合計:             ≈ $0.003（0.45円）
```

## コア機能（5個）

### 1. 音声録音・送信
- `MediaRecorder` APIでマイク音声をキャプチャ
- 録音状態: `idle` → `recording` → `processing`
- 録音停止時に`Blob`(WebM/Opus)を生成しサーバーへ送信
- 最大録音時間: 60秒（タイムアウト自動停止）

### 2. STT変換（4社切り替え可）
- Strategy Patternで実装を抽象化
- フロントのプルダウンで選択したプロバイダーをリクエストに含める
- 入力: 音声バイナリ（WebM/Opus）、出力: テキスト + メタ情報
- 日本語固定（MVP）

### 3. LLM応答生成（Claude API固定）
- Claude Haiku 4.5を使用（MVPでは切り替え不要）
- Strategy Patternのinterfaceは維持し、v2でのLLM追加に備える
- 会話履歴（最大20ターン）をコンテキストとして送信
- システムプロンプト: 「音声チャットボットとして簡潔に日本語で応答する。1-3文程度。」
- 入力: メッセージ配列、出力: 応答テキスト + トークン使用量

### 4. TTS音声生成・再生（3社切り替え可）
- Strategy Patternで実装を抽象化
- サーバーで音声を生成し、Base64エンコードでフロントに返却
- フロントで`AudioContext`を使って再生
- MVP初期は一括受信後再生（v2でストリーミング検討）

### 5. チャットUI
- **上部**: API選択プルダウン2つ（STT / TTS）横並び + LLMはClaude固定表示
  - APIキーが未設定のプロバイダーはプルダウンから除外する
  - 起動時に `GET /api/providers` で利用可能なプロバイダー一覧を取得
  - 各カテゴリで利用可能なプロバイダーが0件の場合、該当プルダウンを無効化し録音ボタンも押せないようにする
  - 利用可能なプロバイダーの先頭をデフォルト選択とする
- **中央**: メッセージ履歴（スクロール可能、自動最下部スクロール）
- **下部**: 録音ボタン（マイクアイコン、状態に応じてアニメーション変化）+ ステータステキスト
  - STT/TTS に1つ以上の利用可能プロバイダーがあり、かつANTHROPIC_API_KEYが設定済みの場合のみ有効化
- ステータス表示: `待機中` → `録音中...` → `文字起こし中...` → `考え中...` → `読み上げ中...`

## APIエンドポイント

### GET /api/providers（利用可能プロバイダー取得）

サーバー起動時に環境変数を検査し、APIキーが設定済みのプロバイダーのみ返す。

レスポンス（JSON）:
```json
{
  "stt": [
    { "id": "groq-whisper", "name": "Groq Whisper Large v3" },
    { "id": "openai-whisper", "name": "OpenAI Whisper" }
  ],
  "llm": {
    "available": true,
    "provider": "claude-haiku",
    "name": "Claude Haiku 4.5"
  },
  "tts": [
    { "id": "minimax-speech", "name": "MINIMAX speech-2.6-turbo" },
    { "id": "elevenlabs-flash", "name": "ElevenLabs Flash" }
  ]
}
```

※ 上記例では Deepgram / Google STT / Cartesia のAPIキーが未設定のため除外されている。LLMはClaude固定のためproviders応答には含めない。

### POST /api/chat（メインパイプライン）

リクエスト（multipart/form-data）:
| フィールド | 型 | 説明 |
|-----------|-----|------|
| audio | File | 音声データ（WebM/Opus） |
| sttProvider | string | STTプロバイダー名 |
| ttsProvider | string | TTSプロバイダー名 |
| messages | string (JSON) | 過去の会話履歴 |

レスポンス（JSON）:
```json
{
  "transcript": "ユーザーの発話テキスト",
  "response": "AIの応答テキスト",
  "audioBase64": "base64エンコード音声",
  "audioMimeType": "audio/mpeg",
  "usage": {
    "stt": { "provider": "groq-whisper", "durationMs": 850 },
    "llm": { "provider": "claude-haiku", "inputTokens": 120, "outputTokens": 45, "durationMs": 1200 },
    "tts": { "provider": "minimax-speech", "characters": 80, "durationMs": 400 }
  }
}
```

### デバッグ用個別エンドポイント
- `POST /api/stt` — 音声 → テキスト
- `POST /api/llm` — テキスト → テキスト
- `POST /api/tts` — テキスト → 音声

## ディレクトリ構成

```
byTech_ai-voice-chat/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
│
├── src/                              # React フロントエンド
│   ├── main.tsx                      # エントリポイント
│   ├── App.tsx                       # ルートコンポーネント
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx     # チャット全体コンテナ
│   │   │   ├── MessageList.tsx       # メッセージ履歴表示
│   │   │   └── MessageBubble.tsx     # 個別メッセージ
│   │   ├── audio/
│   │   │   ├── RecordButton.tsx      # 録音ボタン
│   │   │   └── AudioPlayer.tsx       # TTS音声再生
│   │   └── settings/
│   │       └── ApiSelector.tsx       # STT/LLM/TTS プルダウン選択
│   ├── hooks/
│   │   ├── useAudioRecorder.ts       # マイク入力・録音制御
│   │   ├── useAudioPlayer.ts         # 音声再生制御
│   │   ├── useChat.ts                # チャットロジック（送信・履歴管理）
│   │   └── useApiSelection.ts        # 選択中API管理
│   ├── types/
│   │   ├── chat.ts                   # Message, ChatState 等
│   │   ├── api.ts                    # APIプロバイダー列挙・設定型
│   │   └── audio.ts                  # 音声関連の型
│   └── utils/
│       └── audio-encoder.ts          # 音声フォーマット変換
│
├── server/                           # Hono バックエンド
│   ├── index.ts                      # Honoアプリエントリ
│   ├── routes/
│   │   ├── providers.ts              # GET /api/providers（利用可能API一覧）
│   │   ├── chat.ts                   # POST /api/chat パイプライン
│   │   ├── stt.ts                    # POST /api/stt（デバッグ用）
│   │   ├── llm.ts                    # POST /api/llm（デバッグ用）
│   │   └── tts.ts                    # POST /api/tts（デバッグ用）
│   ├── lib/
│   │   ├── stt/
│   │   │   ├── stt-strategy.ts       # STT Strategy interface
│   │   │   ├── groq-whisper.ts       # Groq Whisper実装
│   │   │   ├── openai-whisper.ts     # OpenAI Whisper実装
│   │   │   ├── deepgram-nova.ts      # Deepgram Nova-3実装
│   │   │   ├── google-cloud-stt.ts   # Google Cloud STT実装
│   │   │   └── index.ts              # ファクトリ
│   │   ├── llm/
│   │   │   ├── llm-strategy.ts       # LLM Strategy interface
│   │   │   ├── claude-haiku.ts       # Claude Haiku実装
│   │   │   └── index.ts              # ファクトリ
│   │   ├── tts/
│   │   │   ├── tts-strategy.ts       # TTS Strategy interface
│   │   │   ├── minimax-speech.ts     # MINIMAX実装
│   │   │   ├── elevenlabs-flash.ts   # ElevenLabs実装
│   │   │   ├── cartesia-sonic.ts     # Cartesia実装
│   │   │   └── index.ts              # ファクトリ
│   │   └── config/
│   │       └── env.ts                # 環境変数バリデーション
│   ├── middleware/
│   │   └── error-handler.ts          # グローバルエラーハンドリング
│   └── utils/
│       └── logger.ts                 # ロガー
│
├── tests/
│   ├── unit/
│   │   ├── server/
│   │   │   ├── stt/                  # 各STT実装のテスト
│   │   │   ├── llm/                  # 各LLM実装のテスト
│   │   │   ├── tts/                  # 各TTS実装のテスト
│   │   │   └── config/               # 環境変数テスト
│   │   └── hooks/                    # React hooksテスト
│   ├── integration/
│   │   └── api/                      # APIエンドポイント統合テスト
│   └── helpers/
│       └── mock-audio.ts             # テスト用音声データ
│
└── docs/
    ├── SPEC.md
    ├── ARCH.md
    └── diagram_patterns.html
```

## 非機能要件

| 項目 | 要件 |
|------|------|
| 応答時間 | E2E 5秒以内（目標3秒: STT 1s + LLM 2s + TTS 1s） |
| 対応ブラウザ | Chrome / Edge 最新版 |
| 対応言語 | 日本語（MVP） |
| 音声形式 | 入力: WebM/Opus、出力: MP3 or WAV |
| 最大録音長 | 60秒 |
| 会話履歴 | メモリ保持、最大20ターン（古いものから切り捨て） |
| 同時接続 | 1（MVP、シングルユーザー） |
| エラー通知 | トースト通知、内部エラー非露出 |
| ロギング | サーバー側で全APIコールをログ（プロバイダー名、レイテンシ、トークン数） |
| セキュリティ | APIキーはサーバーサイドのみ、フロントに露出しない |

## やらないこと（スコープ外・重要）
- ユーザー認証・マルチテナント — v2以降
- 会話履歴の永続化（DB保存） — v2以降
- リアルタイムストリーミングSTT（WebSocket常時接続） — v2以降
- 音声のバージイン（割り込み） — v2以降
- 音声クローン・カスタム音声 — v2以降
- LLMの複数社切り替え（Gemini Flash / GPT-4o mini等） — v2以降
- Pattern E（統合型 Gemini Live等）対応 — v2以降
- モバイル最適化 — v2以降
- レート制限・コスト管理ダッシュボード — v2以降
- 国際化（i18n） — v2以降
- CI/CDパイプライン構築 — v2以降

## テスト戦略

### ユニットテスト（Vitest）
- 各Strategy実装: APIレスポンスをモックし、正常系・異常系をテスト
- ファクトリ関数: プロバイダー名→正しい実装の解決を検証
- 環境変数バリデーション: 必須キー未設定時のエラーを検証
- React hooks: 状態遷移のテスト（React Testing Library + renderHook）

### 統合テスト（Vitest + Hono test client）
- Honoの`app.request()`を使った各APIエンドポイントのテスト
- `POST /api/chat`の全パイプラインテスト

### テスト方針
- 外部APIは全てモック（`vi.mock`またはHTTPレベルモック）
- テスト用音声データはfixtureとして用意
- カバレッジ目標: 80%以上

## 基本コマンド

```bash
pnpm test              # 全テスト実行
pnpm test:unit         # ユニットテストのみ
pnpm test:integration  # 統合テストのみ
pnpm test:coverage     # カバレッジレポート
pnpm build             # ビルド
pnpm typecheck         # 型チェック
pnpm lint              # リント
pnpm dev               # 開発サーバー起動
```

## 完了の定義（これを満たしたらMVP完成）
- [ ] コア機能5つがすべてテスト通過
- [ ] STT(4種)/TTS(3種)のプルダウン切り替えが動作する
- [ ] 日本語で音声会話が成立する（録音→文字起こし→応答→読み上げ）
- [ ] README を読んで 5 分でセットアップできる
- [ ] Docker で起動できる
- [ ] テストカバレッジ 80% 以上
