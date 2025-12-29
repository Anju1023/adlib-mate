# デプロイ手順書：Ad-lib Mate

**最終更新日:** 2025 年 12 月 29 日
**構成:** Frontend (Vercel) + Backend (Render)

## 1. 全体アーキテクチャ

- **Frontend:** Next.js @ Vercel
- **Backend:** FastAPI (Python) @ Render (Web Service)
- **Database:** (将来的に Supabase を使用する場合、ここに記載)

---

## 2. Backend デプロイ手順 (Render)

### 2.1 サービスの作成

1.  [Render Dashboard](https://dashboard.render.com/) にログイン。
2.  **"New +"** ボタンをクリックし、**"Web Service"** を選択。
3.  **"Build and deploy from a Git repository"** を選択。
4.  GitHub リポジトリ `Anju1023/adlib-mate` を接続。

### 2.2 設定項目

| 項目 | 設定値 | 備考 |
| :--- | :--- | :--- |
| **Name** | `adlib-mate-backend` | 任意の名前 |
| **Region** | `Oregon (US West)` | 日本に近いリージョンが望ましいが、無料プランならデフォルトでOK |
| **Branch** | `main` | |
| **Root Directory** | `.` | デフォルト (ルート) |
| **Runtime** | `Python 3` | |
| **Build Command** | `pip install -r backend/requirements.txt` | 依存関係のインストール |
| **Start Command** | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` | アプリケーションの起動 |

### 2.3 環境変数 (Environment Variables)

Render の "Environment" タブで設定してください。

| キー | 値 (例) | 説明 |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | 3.11 系を指定推奨 |
| `GEMINI_API_KEY` | `AIza...` | Google AI Studio の API キー |
| `ALLOWED_ORIGINS` | `https://adlib-mate.vercel.app` | Vercel のデプロイ先 URL (後で設定) |

### 2.4 デプロイ後の確認

- デプロイ完了後、Render から発行される URL (例: `https://adlib-mate-backend.onrender.com`) をコピーしておく。
- `/health` エンドポイントにアクセスして `{"status": "healthy"}` が返れば成功。

---

## 3. Frontend デプロイ手順 (Vercel)

### 3.1 プロジェクトのインポート

1.  [Vercel Dashboard](https://vercel.com/dashboard) にログイン。
2.  **"Add New..."** -> **"Project"** を選択。
3.  GitHub リポジトリ `Anju1023/adlib-mate` をインポート。

### 3.2 設定項目 (Configure Project)

| 項目 | 設定値 |
| :--- | :--- |
| **Framework Preset** | `Next.js` (自動検出されるはず) |
| **Root Directory** | `frontend` | **重要: Edit を押して `frontend` を選択** |

### 3.3 環境変数 (Environment Variables)

| キー | 値 (例) | 説明 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://adlib-mate-backend.onrender.com` | Render のバックエンド URL (末尾の `/` は無し) |

### 3.4 デプロイ実行

- **"Deploy"** ボタンをクリック。
- ビルドが完了するのを待つ。

---

## 4. 最終連携設定 (CORS)

Frontend のデプロイが完了したら、発行された URL (例: `https://adlib-mate.vercel.app`) を確認。

1.  **Render (Backend)** の設定画面に戻る。
2.  Environment Variables の `ALLOWED_ORIGINS` を更新。
    - 値: `https://adlib-mate.vercel.app` (カンマ区切りで複数指定も可)
3.  Render で再デプロイ (Manual Deploy -> Clear build cache & deploy などを推奨) して設定を適用。

---

## 5. 動作確認リスト

- [ ] トップページが表示されること。
- [ ] カメラ/画像アップロード機能が動くこと。
- [ ] バックエンド API (`/api/v1/analyze-score`, `/api/v1/generate-solo`) が正常に呼び出せること (Network タブで確認)。
- [ ] 楽譜が表示され、音が再生されること。
