# 設計書：Ad-lib Mate (アドリブ・メイト)

**最終更新日:** 2025 年 12 月 29 日
**バージョン:** 1.1 (UI/UX Enhanced)

## 1. ディレクトリ構成

### 1.1 全体構成 (Monorepo-like)

```
adlib-mate/
├── backend/          # Python / FastAPI Backend
│   ├── app/
│   │   ├── api/      # API Endpoints
│   │   ├── core/     # Config, AI Clients
│   │   ├── logic/    # Music Theory, Generation Logic (music21)
│   │   ├── models/   # Pydantic Models, DB Models
│   │   └── services/ # Service Layer (Gemini, Lyria, etc.)
│   ├── tests/
│   ├── main.py
│   └── requirements.txt
├── frontend/         # Next.js Frontend
│   ├── app/          # App Router
│   ├── components/   # UI Components
│   ├── lib/          # Utilities, API Clients
│   ├── public/       # Static Assets
│   └── types/        # TypeScript Definitions
├── docs/             # Documentation
└── GEMINI.md         # AI Guidelines
```

## 2. データモデル (Conceptual & Pydantic/TypeScript)

### 2.1 楽譜データ (MusicSheet)

- **ID:** UUID
- **タイトル:** String
- **キー:** String (e.g., "C", "Bb")
- **コード進行:** List[ChordMeasure] (e.g., `[{"measure": 1, "chords": ["Dm7", "G7"]}, ...]`)
- **生成されたソロ:** List[SoloNote]

### 2.2 ソロ設定 (SoloConfig)

- **難易度 (Difficulty):** Enum ("Beginner", "Intermediate", "Advanced")
- **楽器 (Instrument):** Enum ("Saxophone", "Trumpet", "Piano", etc.)
- **雰囲気 (Vibe):** Enum ("Swing", "Bossa", "Funk")

## 3. API エンドポイント (Backend: FastAPI)

### 3.1 解析・生成系

- `POST /api/v1/analyze-score`: 画像をアップロードし、コード進行テキストを返す。
    - **Input:** Multipart/form-data (image)
    - **Output:** JSON `{ "title": "...", "key": "...", "chords": [...] }`
- `POST /api/v1/generate-solo`: コード進行と設定を受け取り、ソロ（MusicXML/MIDIデータ）を返す。
    - **Input:** JSON `{ "chords": [...], "config": {...} }`
    - **Output:** JSON `{ "music_xml": "...", "explanation": "..." }`
- `GET /api/v1/synthesize-audio`: MIDI/MusicXML を受け取り、音声データをストリームする。
    - **Input:** Query Params (or POST body)
    - **Output:** Audio Stream (mp3/wav)

## 4. フロントエンド設計 (Next.js)

### 4.1 ページ構成

- `/`: ランディングページ & 新規プロジェクト作成（アップロード or テキスト入力）
- `/studio`: メイン画面。楽譜表示、再生コントロール、設定パネル。
- `/history`: 過去の生成履歴（MVP以降）

### 4.2 主要コンポーネント

- `ScoreViewer`: OpenSheetMusicDisplay (OSMD) をラップした楽譜表示コンポーネント。
- `ControlPanel`: 難易度や楽器の設定を行うフォーム。
- `AudioPlayer`: Tone.js または ネイティブ Audio API を使った再生プレイヤー。

## 5. UI/UX デザインシステム "Midnight Jazz Club"

### 5.1 コンセプト
- **Mood:** 薄暗いジャズバーや練習スタジオの没入感。
- **Focus:** 演奏の邪魔をしない、目に優しいダークモード標準。
- **Accessibility:** 楽器を持ちながら片手で操作できる大きなタッチターゲット。

### 5.2 カラーパレット (Tailwind CSS bases)

| 用途 | 色味 | Tailwind Class (Approx) | Hex | 意図 |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | **Deep Night** | `bg-slate-950` | `#020617` | 漆黒の背景で楽譜を際立たせる |
| **Surface** | **Studio Gray** | `bg-slate-900` | `#0f172a` | カードやパネルの背景 |
| **Primary** | **Brass Gold** | `text-amber-500` | `#f59e0b` | 管楽器（サックス/トランペット）の輝き。アクションボタンに使用 |
| **Secondary** | **Neon Blue** | `text-indigo-500` | `#6366f1` | AI の知性、テクノロジー感 |
| **Text** | **Off White** | `text-slate-50` | `#f8fafc` | 完全な白より目に優しいテキスト |
| **Accent** | **Crimson** | `text-rose-500` | `#f43f5e` | 現在再生中の場所やエラー表示 |

### 5.3 タイポグラフィ

- **Headings:** サンセリフ体 (Inter, Roboto)。モダンでクリーンな印象。
- **Body:** 視認性の高いサンセリフ体。
- **Chords/Music:** 等幅フォント (JetBrains Mono, Roboto Mono) またはジャズの手書き風フォント（装飾用）。

### 5.4 UI コンポーネント指針

- **ボタン:**
    - 最小高さ `48px` (44px +)。楽器を持った指でも押し間違えないサイズ感。
    - プライマリアクション（生成、再生）は画面下部に固定またはフローティング (FAB) させて親指で届く範囲に。
- **楽譜表示 (OSMD):**
    - 背景色は白ではなく、少しトーンを落としたクリーム色 (`#fffbeb`) か、反転表示（黒背景に白音符）を検討オプションとする。
    - **カーソル:** 再生位置を示すバーは `Amber-500` (Gold) で光らせる。
- **フィードバック:**
    - ローディング中は「考え中...」ではなく、「即興演奏を構想中...」「バンドメンバーを収集中...」など音楽的なマイクロコピーを使用。
    - 音声波形ビジュアライザーを表示して「音が鳴っている」ことを視覚的に伝える。

## 6. 技術選定詳細

- **Styling:** Tailwind CSS v4 (Utility-First)
- **State Management:** React Context or Zustand (必要に応じて)
- **Validation:** Zod (Frontend & Backend shared concepts where possible)