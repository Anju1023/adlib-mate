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
        - [x] Gemini-3-pro-preview (Reasoning) を使ったフレーズ構想ロジック
        - [x] 音楽理論に基づいたアドバイス（解説）の生成 API

---

## 進行中 🏗️
- [ ] **Sound: 音声合成**
    - [x] Tone.js によるフォールバック再生
- [ ] **UI/UX: ブラッシュアップ**
    - [x] 再生カーソルと楽譜の同期
    - [x] PWA 対応
    - [ ] ダークモード (Midnight Jazz) の完成度向上

---

## バックログ 📋
- [ ] **Sound: 音声合成**
    - [ ] Lyria-realtime-exp による高品質オーディオ生成 (API 権限が必要)
