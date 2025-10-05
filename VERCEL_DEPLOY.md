# Vercel デプロイガイド

## 概要

このプロジェクトをVercelにデプロイして、OpenAI APIを安全に利用できる構成にする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント
- OpenAI APIキー

## デプロイ手順

### 1. GitHubリポジトリの準備

```bash
# リポジトリをクローン（既にクローン済みの場合はスキップ）
git clone https://github.com/allgens/portfolio-corporate-site-ai.git
cd portfolio-corporate-site-ai

# 最新のコードをプッシュ
git add .
git commit -m "feat: Vercel deployment setup"
git push origin main
```

### 2. Vercelアカウントの作成と連携

1. [Vercel](https://vercel.com/)にアクセス
2. GitHubアカウントでサインアップ
3. "New Project"をクリック
4. GitHubリポジトリを選択: `allgens/portfolio-corporate-site-ai`

### 3. 環境変数の設定

#### Vercelダッシュボードでの設定

1. プロジェクト設定画面で"Environment Variables"を選択
2. 以下の環境変数を追加：

```
Name: OPENAI_API_KEY
Value: your-openai-api-key-here
Environment: Production, Preview, Development
```

#### ローカル開発用の設定

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集してAPIキーを設定
# OPENAI_API_KEY=your-openai-api-key-here
```

### 4. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. アカウントを作成またはログイン
3. "API Keys"セクションで新しいキーを作成
4. 作成されたキーをコピーしてVercelの環境変数に設定

### 5. デプロイの実行

1. Vercelダッシュボードで"Deploy"をクリック
2. デプロイが完了するまで待機（通常2-3分）
3. デプロイ完了後、提供されたURLでサイトにアクセス

## ファイル構成

```
portfolio-corporate-site-ai/
├── api/
│   └── chat.js              # Vercel APIエンドポイント
├── js/
│   └── chatbot.js           # フロントエンド（API呼び出し）
├── css/
│   └── chatbot.css          # チャットボットスタイル
├── .env.example             # 環境変数のサンプル
├── .gitignore              # Git除外設定
├── vercel.json             # Vercel設定ファイル
└── VERCEL_DEPLOY.md        # このファイル
```

## API動作の流れ

1. **フロントエンド**: ユーザーがチャットボットにメッセージを入力
2. **API呼び出し**: `fetch('/api/chat')`でVercelのAPIエンドポイントにPOST
3. **API処理**: `/api/chat.js`がOpenAI APIを呼び出し
4. **AI応答**: OpenAIから生成された応答をフロントエンドに返す
5. **表示**: チャットボットにAI応答を表示

## セキュリティ

### APIキーの保護
- ✅ APIキーは環境変数で管理
- ✅ フロントエンドにはAPIキーを露出しない
- ✅ GitHubにはAPIキーを含めない

### CORS設定
- ✅ 適切なCORSヘッダーを設定
- ✅ プリフライトリクエストに対応

### エラーハンドリング
- ✅ API接続エラー時のフォールバック
- ✅ 適切なエラーメッセージの表示

## トラブルシューティング

### よくある問題

#### 1. API応答が表示されない
**原因**: OpenAI APIキーが設定されていない
**解決方法**: 
- Vercelダッシュボードで環境変数を確認
- APIキーが正しく設定されているか確認

#### 2. CORSエラーが発生する
**原因**: フロントエンドとAPIのドメインが異なる
**解決方法**: 
- `vercel.json`のCORS設定を確認
- APIエンドポイントのURLを確認

#### 3. デプロイが失敗する
**原因**: ファイル構成や設定の問題
**解決方法**: 
- Vercelのデプロイログを確認
- `vercel.json`の設定を確認

### デバッグ方法

#### ローカルでのテスト
```bash
# Vercel CLIをインストール
npm i -g vercel

# ローカルでテスト
vercel dev
```

#### ログの確認
- Vercelダッシュボードの"Functions"タブでログを確認
- ブラウザの開発者ツールでコンソールログを確認

## 料金

### Vercel
- **Hobby Plan**: 無料（個人プロジェクト用）
- **Pro Plan**: $20/月（チーム用）

### OpenAI API
- **GPT-4o-mini**: $0.00015/1K tokens（入力）、$0.0006/1K tokens（出力）
- **新規アカウント**: $5の無料クレジット

## 今後の拡張

### 機能追加
- [ ] 会話履歴の永続化
- [ ] ユーザー認証
- [ ] レート制限
- [ ] 多言語対応

### パフォーマンス向上
- [ ] キャッシュ機能
- [ ] ストリーミング応答
- [ ] CDN最適化

## サポート

問題が発生した場合：
1. このガイドを確認
2. Vercelのドキュメントを確認
3. GitHub Issuesで報告

---

**注意**: このプロジェクトは教育・デモ目的で作成されています。本番環境での使用前に、セキュリティとパフォーマンスの検証を行ってください。
