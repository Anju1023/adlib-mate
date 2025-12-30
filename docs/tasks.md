# タスク管理 (Ad-lib Mate)

## 完了済み ✅

- [x] プロジェクトの初期化

    - [x] フロントエンド (Next.js 15/16) のセットアップ

    - [x] バックエンド (FastAPI) のセットアップ

- [x] **Phase 1: MVP (Text Input -> Logic Generation -> Score View)**

    - [x] **Backend: 基本構成**

        - [x] FastAPI のボイラープレート作成

        - [x] music21 のインストールと動作確認

        - [x] 基本的なコード進行解析ロジックの実装

    - [x] **Frontend: 基本構成**

        - [x] Tailwind CSS v4 のセットアップ (Midnight Jazz Club テーマ)

        - [x] 基本レイアウトの作成

    - [x] **Core: ソロ生成エンジン (V1)**

        - [x] music21 を使ったスケールベースの音符生成

        - [x] MusicXML の出力機能

    - [x] **Frontend: 楽譜表示**

        - [x] OpenSheetMusicDisplay (OSMD) の統合

        - [x] 生成された MusicXML のレンダリング

- [x] **Phase 2: AI 統合 (Vision & Reasoning)**

    - [x] **AI: Vision モジュール**

        - [x] Gemini-3-flash-preview を使った楽譜画像解析 API

        - [x] フロントエンドのカメラ撮影・アップロード機能

    - [x] **AI: Brain モジュール**

        - [x] Gemini-3-pro-preview (Reasoning) を使ったフレーズ構想ロジック（※現在は低遅延化のため Flash を使用）

        - [x] 音楽理論に基づいたアドバイス（解説）の生成 API

- [x] **Phase 3: デプロイ準備 & 完了**

    - [x] **Backend: 本番環境設定**

        - [x] Render 向けの CORS 設定更新 (`main.py`)

        - [x] 依存関係の整理 (`requirements.txt`)

    - [x] **Frontend: 本番環境設定**

        - [x] Vercel 向けの API URL 環境変数設定

    - [x] **Verification**

        - [x] `npm run build` (Frontend) の実行確認

        - [x] `uvicorn` (Backend) の起動確認

        - [x] Vercel + Render 間での CORS 通信確認



---



## 進行中 🏗️

- [ ] **Phase 4: ユーザー体験の向上**

    - [ ] 音声合成の品質向上

    - [ ] 生成履歴の保存機能



---

## バックログ 📋
- [ ] **Sound: 音声合成**
    - [ ] Lyria-realtime-exp による高品質オーディオ生成 (API 権限が必要)
