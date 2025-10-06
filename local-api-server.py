#!/usr/bin/env python3
"""
ローカル開発用のモックAPIサーバー
チャットボットのテスト用にPOSTリクエストを処理します
"""

import http.server
import socketserver
import json
import urllib.parse
from datetime import datetime

class MockAPIHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        """POSTリクエストを処理"""
        if self.path == '/api/chat':
            self.handle_chat_api()
        else:
            self.send_error(404, "API endpoint not found")
    
    def handle_chat_api(self):
        """チャットAPIのモック処理"""
        try:
            # リクエストボディを読み取り
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # JSONをパース
            data = json.loads(post_data.decode('utf-8'))
            message = data.get('message', '')
            form_data = data.get('formData', {})
            
            print(f"📝 Received message: {message}")
            print(f"📊 Form data: {form_data}")
            
            # モック応答を生成
            mock_response = self.generate_mock_response(message, form_data)
            
            # レスポンスを送信
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response_data = {
                'response': mock_response,
                'timestamp': datetime.now().isoformat(),
                'source': 'local-mock-api'
            }
            
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            print(f"❌ Error processing request: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def generate_mock_response(self, message, form_data):
        """メッセージに基づいてモック応答を生成"""
        message_lower = message.lower()
        
        # 挨拶
        if any(word in message_lower for word in ['こんにちは', 'hello', 'はじめまして', 'おはよう', 'こんばんは']):
            return "こんにちは！AIアシスタントのallgensです。お問い合わせフォームの入力をお手伝いさせていただきます。どのようなご相談でしょうか？"
        
        # 連絡先情報
        if any(word in message_lower for word in ['連絡先', '電話', 'メール', '住所', 'アクセス', '会社情報']):
            return """連絡先情報をご案内いたします。

📞 **電話番号**: 03-1234-5678
📧 **メールアドレス**: info@allgens.co.jp
📍 **所在地**: 〒100-0001 東京都千代田区千代田1-1-1 バーチャルオフィス
🕒 **営業時間**: 平日 9:00-18:00

🚇 **アクセス**:
・JR山手線・中央線・総武線「東京駅」徒歩5分
・東京メトロ丸ノ内線「東京駅」徒歩3分
・東京メトロ東西線「大手町駅」徒歩7分

ご不明な点がございましたら、お気軽にお問い合わせください。"""
        
        # 料金・価格
        if any(word in message_lower for word in ['料金', '費用', '価格', 'いくら', 'コスト', '予算', 'プラン']):
            return """料金についてご案内いたします。

💰 **料金体系**:
・初回相談: **無料**
・AI導入コンサルティング: 月額15万円〜
・システム運用サポート: 月額8万円〜
・ECマーケティング支援: 月額12万円〜
・システム開発: プロジェクト別見積

📋 **料金の特徴**:
・お客様の規模に応じた柔軟なプラン
・成果に応じた成果報酬型も対応可能
・初期費用・ランニングコストの最適化

詳細な料金は、お客様のご要望をお聞きした上でご提案いたします。まずは無料相談にお越しください。"""
        
        # サービス選択
        if any(word in message_lower for word in ['サービス', '選択', 'どの', 'どれ', 'おすすめ', '提案']):
            return """サービス選択についてご案内いたします。

🤖 **AI導入コンサルティング**
・業務効率化のためのAI活用提案
・既存システムとの連携設計
・AIモデルの選定・導入支援

🖥️ **システム運用サポート**
・24時間365日の監視体制
・障害対応・予防保守
・セキュリティ対策

🛒 **ECマーケティング支援**
・オンライン販売戦略立案
・SEO・SEM対策
・顧客分析・改善提案

💻 **システム開発**
・Webアプリケーション開発
・業務システム構築
・モバイルアプリ開発

どのサービスにご興味がございますか？詳しくご説明いたします。"""
        
        # AI関連
        if any(word in message_lower for word in ['ai', '人工知能', '機械学習', 'chatgpt', '自動化']):
            return """AI導入について詳しくご説明いたします。

🤖 **AI導入のメリット**:
・業務効率化（作業時間50%削減）
・コスト削減（人件費30%削減）
・精度向上（エラー率90%削減）
・24時間稼働（無人運用可能）

📊 **導入事例**:
・顧客対応の自動化（チャットボット）
・データ分析・レポート生成
・画像認識・文書処理
・予測分析・需要予測

🛠️ **導入プロセス**:
1. 現状分析・課題抽出（1週間）
2. AIソリューション設計（2週間）
3. プロトタイプ開発（1ヶ月）
4. 本格導入・運用開始（2ヶ月）

どの分野でのAI活用をお考えでしょうか？具体的なご相談を承ります。"""
        
        # システム運用
        if any(word in message_lower for word in ['システム', '運用', '保守', '監視', '障害']):
            return """システム運用サポートについてご説明いたします。

🔧 **運用サービス内容**:
・24時間365日のシステム監視
・障害発生時の迅速な対応
・定期メンテナンス・アップデート
・セキュリティパッチ適用
・バックアップ・復旧対応

📊 **監視対象**:
・サーバー稼働状況
・アプリケーション性能
・ネットワーク状況
・セキュリティ脅威
・データベース状態

⚡ **対応体制**:
・初動対応: 15分以内
・重要度別エスカレーション
・専任エンジニアによる対応
・定期的な運用レポート

現在どのようなシステムの運用でお困りでしょうか？"""
        
        # ECマーケティング
        if any(word in message_lower for word in ['ec', 'eコマース', 'マーケティング', '販売', 'オンライン']):
            return """ECマーケティング支援についてご説明いたします。

🛒 **ECサイト構築・改善**:
・レスポンシブデザイン対応
・ユーザビリティ向上
・決済システム連携
・在庫管理システム構築

📈 **マーケティング施策**:
・SEO対策（検索順位向上）
・SEM運用（広告最適化）
・SNSマーケティング
・メールマーケティング

📊 **データ分析・改善**:
・売上分析・レポート作成
・顧客行動分析
・コンバージョン改善
・A/Bテスト実施

💰 **成果実績**:
・売上平均150%向上
・コンバージョン率平均80%向上
・顧客獲得コスト50%削減

現在のECサイトの状況について教えてください。"""
        
        # スケジュール・期間
        if any(word in message_lower for word in ['スケジュール', '期間', 'いつ', 'どれくらい', '納期', '開始']):
            return """プロジェクトのスケジュールについてご案内いたします。

⏰ **一般的な期間**:
・AI導入コンサルティング: 3-6ヶ月
・システム運用開始: 1-2ヶ月
・ECマーケティング支援: 2-4ヶ月
・システム開発: 3-12ヶ月（規模による）

📅 **プロジェクト進行**:
1. **要件定義・設計**: 2-4週間
2. **開発・実装**: プロジェクト規模による
3. **テスト・検証**: 2-4週間
4. **本格運用開始**: 1週間

🚀 **迅速開始可能**:
・初回相談: 即日対応可能
・緊急対応: 24時間以内
・小規模案件: 1週間以内開始

お客様のご要望に応じて、最適なスケジュールをご提案いたします。いつ頃から開始をお考えでしょうか？"""
        
        # 使い方・操作方法
        if any(word in message_lower for word in ['使い方', '操作', '方法', 'どうやって', 'ガイド']):
            return """チャットボットの使い方をご案内いたします。

💬 **基本的な使い方**:
1. 下の入力欄にメッセージを入力
2. 送信ボタン（紙飛行機アイコン）をクリック
3. AIが自動で回答を生成

🎯 **クイックアクション**:
・サービス選択のヘルプ: サービス紹介
・メッセージ下書き: フォーム内容を反映した下書き作成
・料金について: 料金体系の説明
・連絡先情報: 会社情報・アクセス案内
・使い方ガイド: この説明を表示

📝 **フォーム連携**:
フォームに入力した内容は自動的にチャットボットが認識し、より適切な提案を行います。

❓ **その他の質問**:
何でもお気軽にお聞きください。AIがお答えできない場合は、スタッフが対応いたします。"""
        
        # フォーム内容に基づく提案
        if form_data:
            service = form_data.get('service', '')
            if service == 'ai':
                return "AI導入コンサルティングをお考えですね。お客様のビジネスに最適なAIソリューションをご提案いたします。現在の業務プロセスについて詳しく教えていただけますか？"
            elif service == 'system':
                return "システム運用サポートをお考えですね。安定したシステム運用でお客様のビジネスをサポートします。どのようなシステムの運用でお困りでしょうか？"
            elif service == 'ec':
                return "ECマーケティング支援をお考えですね。オンライン販売の売上向上をサポートいたします。現在のECサイトの状況について教えてください。"
            elif service == 'development':
                return "システム開発をお考えですね。お客様のご要望に応じたシステムを開発いたします。どのようなシステムをお考えでしょうか？"
        
        # デフォルト応答（より詳細で有用な情報を提供）
        return f"""「{message}」についてお聞きしました。

お客様のご要望に応じて最適なソリューションをご提案いたします。

🎯 **お手伝いできること**:
・サービス選択のアドバイス
・具体的な料金・期間のご案内
・技術的なご質問への回答
・導入事例のご紹介
・無料相談のご案内

より詳しく教えていただけますか？例えば：
- どのような課題をお持ちですか？
- いつ頃の導入をお考えですか？
- 予算の目安はございますか？

お気軽にご質問ください！"""
    
    def do_OPTIONS(self):
        """CORSプリフライトリクエストを処理"""
        if self.path == '/api/chat':
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
        else:
            super().do_OPTIONS()

def run_server(port=8000):
    """サーバーを起動"""
    handler = MockAPIHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 ローカルAPIサーバーが起動しました")
        print(f"📡 ポート: {port}")
        print(f"🔗 URL: http://localhost:{port}")
        print(f"📝 チャットAPI: http://localhost:{port}/api/chat")
        print(f"🧪 デバッグページ: http://localhost:{port}/debug.html")
        print(f"📋 お問い合わせページ: http://localhost:{port}/contact.html")
        print(f"\n⏹️  停止するには Ctrl+C を押してください")
        print("=" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 サーバーを停止しました")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
