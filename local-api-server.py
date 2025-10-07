#!/usr/bin/env python3
"""
ローカル開発用のモックAPIサーバー（RAG対応）
チャットボットのテスト用にPOSTリクエストを処理します
"""

import http.server
import socketserver
import json
import urllib.parse
import re
import math
from collections import Counter
from datetime import datetime

# RAG機能を直接実装
def load_company_data():
    """会社情報データを読み込み"""
    try:
        with open('data/companyInfo.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: companyInfo.json not found, using fallback data")
        return {
            "company": {"name": "TechCorp", "description": "AI技術を活用した企業向けソリューションを提供"},
            "services": [],
            "representative": {"name": "高倉 樹", "message": "AI技術の民主化を目指しています"},
            "faq": []
        }

def text_to_vector(text):
    """テキストをベクトル化（最適化版）"""
    if not text or not isinstance(text, str):
        return {}
    
    # テキストを正規化
    text = text.lower().strip()
    
    # 日本語の文字を保持しつつ、記号を除去
    text = re.sub(r'[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', ' ', text)
    
    # 単語を分割
    words = []
    
    # スペースで分割された単語（2文字以上）
    for word in text.split():
        if len(word) > 1:
            words.append(word)
    
    # 日本語の文字単位でも分割（より細かく）
    japanese_chars = re.findall(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', text)
    for char in japanese_chars:
        if len(char) > 0:
            words.append(char)
    
    # 重複を除去しつつ、頻度をカウント
    word_count = Counter(words)
    
    return dict(word_count)

def cosine_similarity(vec_a, vec_b):
    """コサイン類似度を計算"""
    keys = set(vec_a.keys()) | set(vec_b.keys())
    dot_product = sum(vec_a.get(key, 0) * vec_b.get(key, 0) for key in keys)
    norm_a = math.sqrt(sum(vec_a.get(key, 0) ** 2 for key in keys))
    norm_b = math.sqrt(sum(vec_b.get(key, 0) ** 2 for key in keys))
    
    if norm_a == 0 or norm_b == 0:
        return 0
    
    return dot_product / (norm_a * norm_b)

def create_knowledge_base():
    """ナレッジベースを作成"""
    company_data = load_company_data()
    knowledge_base = []
    
    # 会社基本情報
    company = company_data.get('company', {})
    if company:
        content = f"{company.get('name', 'TechCorp')}は{company.get('description', 'AI技術を活用した企業向けソリューションを提供')}。{company.get('founded', '2020年')}年に設立され、{company.get('location', '東京都渋谷区')}に本社を構えています。"
        knowledge_base.append({
            'id': 'company-basic',
            'content': content,
            'category': 'company',
            'vector': text_to_vector(content)
        })
    
    # 代表者情報
    representative = company_data.get('representative', {})
    if representative:
        content = f"代表取締役CEOの{representative.get('name', '高倉 樹')}です。{representative.get('message', 'AI技術の民主化を目指しています')} {representative.get('background', '東京大学工学部卒業後、大手IT企業でAI研究開発に従事')}"
        knowledge_base.append({
            'id': 'representative',
            'content': content,
            'category': 'representative',
            'vector': text_to_vector(content)
        })
    
    # サービス情報
    services = company_data.get('services', [])
    for service in services:
        content = f"{service.get('name', '')}: {service.get('description', '')} 対象: {service.get('target', '')} 料金: {service.get('price', '')}"
        knowledge_base.append({
            'id': f"service-{service.get('id', '')}",
            'content': content,
            'category': 'service',
            'vector': text_to_vector(content)
        })
        
        # サービス詳細
        features = service.get('features', [])
        for i, feature in enumerate(features):
            content = f"{service.get('name', '')}の機能: {feature}"
            knowledge_base.append({
                'id': f"service-{service.get('id', '')}-feature-{i}",
                'content': content,
                'category': 'service-feature',
                'vector': text_to_vector(content)
            })
    
    # FAQ
    faq = company_data.get('faq', [])
    for i, item in enumerate(faq):
        content = f"Q: {item.get('question', '')} A: {item.get('answer', '')}"
        knowledge_base.append({
            'id': f"faq-{i}",
            'content': content,
            'category': 'faq',
            'vector': text_to_vector(content)
        })
    
    # 連絡先情報
    contact = company_data.get('contact', {})
    if contact:
        content = f"連絡先: {contact.get('office', '')} 営業時間: {contact.get('businessHours', '')} 初回相談: {contact.get('consultation', '')} 回答時間: {contact.get('responseTime', '')}"
        knowledge_base.append({
            'id': 'contact',
            'content': content,
            'category': 'contact',
            'vector': text_to_vector(content)
        })
    
    return knowledge_base

def search_relevant_info(query, knowledge_base, top_k=3):
    """関連する情報を検索（キーワードベース + ベクトル類似度）"""
    if not query or not knowledge_base:
        return []
    
    print(f"🔍 Query: '{query}'")
    
    # キーワードベースの検索
    query_lower = query.lower()
    keyword_matches = []
    
    # 代表者関連のキーワード
    if any(keyword in query_lower for keyword in ['代表', '代表者', 'ceo', '社長', '取締役']):
        for item in knowledge_base:
            if item['category'] == 'representative':
                keyword_matches.append({**item, 'similarity': 1.0, 'match_type': 'keyword'})
    
    # 会社情報関連のキーワード
    if any(keyword in query_lower for keyword in ['会社', '企業', '概要', '情報', 'techcorp', 'サンプル']):
        for item in knowledge_base:
            if item['category'] == 'company':
                keyword_matches.append({**item, 'similarity': 0.9, 'match_type': 'keyword'})
    
    # サービス関連のキーワード
    if any(keyword in query_lower for keyword in ['サービス', '料金', '価格', '費用', 'コンサル', '開発', 'ai', 'システム']):
        for item in knowledge_base:
            if item['category'] == 'service':
                keyword_matches.append({**item, 'similarity': 0.8, 'match_type': 'keyword'})
    
    # 連絡先関連のキーワード
    if any(keyword in query_lower for keyword in ['連絡', '電話', 'メール', '住所', 'アクセス', 'お問い合わせ']):
        for item in knowledge_base:
            if item['category'] == 'contact':
                keyword_matches.append({**item, 'similarity': 0.9, 'match_type': 'keyword'})
    
    # ベクトル類似度による検索
    query_vector = text_to_vector(query)
    vector_matches = []
    
    for item in knowledge_base:
        if 'vector' in item and item['vector']:
            similarity = cosine_similarity(query_vector, item['vector'])
            if similarity > 0.01:  # 閾値を設定
                vector_matches.append({**item, 'similarity': similarity, 'match_type': 'vector'})
    
    # ベクトル類似度でソート
    vector_matches.sort(key=lambda x: x['similarity'], reverse=True)
    
    # 結果を統合
    all_matches = keyword_matches + vector_matches
    
    # 重複を除去（同じIDの場合はキーワードマッチを優先）
    seen_ids = set()
    result = []
    
    # キーワードマッチを優先
    for item in keyword_matches:
        if item['id'] not in seen_ids:
            result.append(item)
            seen_ids.add(item['id'])
    
    # ベクトルマッチを追加
    for item in vector_matches:
        if item['id'] not in seen_ids and len(result) < top_k:
            result.append(item)
            seen_ids.add(item['id'])
    
    # デバッグ情報
    print(f"📊 Keyword matches: {len(keyword_matches)}")
    print(f"📊 Vector matches: {len(vector_matches)}")
    print(f"✅ Returning {len(result)} items:")
    for item in result:
        print(f"  - {item['id']} ({item['category']}, {item['match_type']}): {item['similarity']:.3f}")
    
    return result[:top_k]

def format_context(relevant_info):
    """検索結果をコンテキストとして整形"""
    if not relevant_info:
        return "関連する情報が見つかりませんでした。"
    
    context = "【関連情報】\n"
    for i, item in enumerate(relevant_info, 1):
        context += f"{i}. {item['content']}\n"
    
    return context

RAG_AVAILABLE = True

class MockAPIHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        """POSTリクエストを処理"""
        if self.path == '/api/chat':
            self.handle_chat_api()
        else:
            self.send_error(404, "API endpoint not found")
    
    def handle_chat_api(self):
        """チャットAPIのRAG対応モック処理"""
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
            
            # RAG対応のモック応答を生成
            print("🚀 Starting RAG processing...")
            print(f"📝 Message: '{message}'")
            mock_response = self.generate_rag_mock_response(message, form_data)
            print(f"✅ RAG processing completed")
            
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
                'source': 'local-rag-mock-api'
            }
            
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            print(f"❌ Error processing request: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def generate_rag_mock_response(self, message, form_data):
        """RAG対応のモック応答を生成"""
        try:
            print("🔍 Creating knowledge base...")
            knowledge_base = create_knowledge_base()
            print(f"📚 Knowledge base created with {len(knowledge_base)} items")
            
            print("🔍 Searching relevant information...")
            relevant_info = search_relevant_info(message, knowledge_base, 3)
            print(f"📊 Found {len(relevant_info)} relevant items")
            
            print("📝 Formatting context...")
            context = format_context(relevant_info)
            
            print("🤖 Generating RAG mock response...")
            
            # RAG対応の応答を生成（改良版）
            if context and context != "関連する情報が見つかりませんでした。":
                form_info = ""
                if form_data:
                    if form_data.get('name'):
                        form_info += f"お名前: {form_data['name']}様\n"
                    if form_data.get('company'):
                        form_info += f"会社名: {form_data['company']}\n"
                
                # メッセージに基づいて具体的な回答を生成
                response = self.generate_specific_response(message, relevant_info, form_data, form_info)
            else:
                # コンテキストがない場合は基本的な応答
                response = f"""お問い合わせいただき、ありがとうございます！

{message}についてお答えいたします。

TechCorpはAI技術を活用した企業向けソリューションを提供しています。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""
            
            return response
            
        except Exception as e:
            print(f"❌ Error in RAG processing: {e}")
            # フォールバック: 基本的なモック応答
            return self.generate_mock_response(message, form_data)
    
    def generate_mock_response(self, message, form_data):
        """メッセージに基づいてモック応答を生成"""
        message_lower = message.lower()
        
        # 挨拶
        if any(word in message_lower for word in ['こんにちは', 'hello', 'はじめまして', 'おはよう', 'こんばんは']):
            return "こんにちは！AIアシスタントです。お問い合わせフォームの入力をお手伝いさせていただきます。どのようなご相談でしょうか？"
        
        # 連絡先情報
        if any(word in message_lower for word in ['連絡先', '電話', 'メール', '住所', 'アクセス', '会社情報']):
            return """連絡先情報をご案内いたします。

📞 **電話番号**: 03-1234-5678
📧 **メールアドレス**: contact@example.com
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
        
        # デフォルト応答（制限事項付き）
        return f"""「{message}」についてお聞きしました。

申し訳ございませんが、お客様のご質問について、当社のホームページに記載されている情報の中では、適切な回答を提供できません。

**当社がお答えできる情報**:
・会社概要・代表者情報
・提供サービス（AI導入コンサルティング、システム運用サポート、ECマーケティング支援、システム開発）
・料金体系・お見積もり
・連絡先・アクセス情報
・よくある質問（FAQ）

**重要事項**:
・上記の情報は当社の公式情報に基づいてお答えしています
・ホームページに記載されていない情報については、お答えできません
・より詳細な情報が必要な場合は、直接お問い合わせください

より具体的なご質問や、上記の情報に関する詳細なご相談がございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先**:
・電話: 03-1234-5678
・メール: info@allgens.co.jp"""
    
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
    
    def generate_specific_response(self, message, relevant_info, form_data, form_info):
        """メッセージに基づいて具体的な回答を生成（高精度版）"""
        message_lower = message.lower()
        
        # 代表者に関する質問
        if any(keyword in message_lower for keyword in ['代表', '代表者', 'ceo', '社長', '取締役', '誰']):
            for item in relevant_info:
                if item['category'] == 'representative':
                    return f"""お問い合わせいただき、ありがとうございます！

**代表者について**

{item['content']}

{form_info}

**重要事項：**
• 上記の情報は当社の公式情報に基づいてお答えしています
• ホームページに記載されていない情報については、お答えできません
• より詳細な情報が必要な場合は、直接お問い合わせください

ご不明な点や追加でお聞きになりたいことがございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""
        
        # 料金に関する質問
        elif any(keyword in message_lower for keyword in ['料金', '価格', '費用', 'いくら', 'コスト']):
            service_info = [item for item in relevant_info if item['category'] == 'service']
            if service_info:
                response = f"""お問い合わせいただき、ありがとうございます！

**料金について**

"""
                for item in service_info:
                    response += f"• {item['content']}\n\n"
                response += f"""{form_info}

**重要事項：**
• 上記の料金情報は当社の公式情報に基づいてお答えしています
• 具体的な料金は、お客様のご要望・規模・期間により異なります
• ホームページに記載されていない料金については、お答えできません
• 詳細な料金については、お客様のご要望に応じて個別にお見積もりいたします

ご不明な点や追加でお聞きになりたいことがございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""
                return response
        
        # サービスに関する質問
        elif any(keyword in message_lower for keyword in ['サービス', '何が', 'できる', '提供', '選択']):
            service_info = [item for item in relevant_info if item['category'] == 'service']
            if service_info:
                response = f"""お問い合わせいただき、ありがとうございます！

**提供サービス**

"""
                for item in service_info:
                    response += f"• {item['content']}\n\n"
                response += f"""{form_info}

**重要事項：**
• 上記のサービス情報は当社の公式情報に基づいてお答えしています
• ホームページに記載されていないサービスについては、お答えできません
• 各サービスの詳細な内容については、個別にご相談ください
• お客様のご要望に応じたカスタマイズも可能です

ご不明な点や追加でお聞きになりたいことがございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""
                return response
        
        # 連絡先に関する質問
        elif any(keyword in message_lower for keyword in ['連絡', '電話', 'メール', '住所', 'アクセス', 'お問い合わせ']):
            contact_info = [item for item in relevant_info if item['category'] == 'contact']
            if contact_info:
                response = f"""お問い合わせいただき、ありがとうございます！

**連絡先情報**

"""
                for item in contact_info:
                    response += f"{item['content']}\n\n"
                response += f"""{form_info}

**重要事項：**
• 上記の連絡先情報は当社の公式情報に基づいてお答えしています
• ホームページに記載されていない連絡先については、お答えできません
• 営業時間外のお問い合わせについては、翌営業日にご回答いたします
• 緊急の場合は、お電話にてお問い合わせください

ご不明な点や追加でお聞きになりたいことがございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""
                return response
        
        # 会社情報に関する質問
        elif any(keyword in message_lower for keyword in ['会社', '企業', '概要', '情報', 'techcorp', 'サンプル']):
            company_info = [item for item in relevant_info if item['category'] == 'company']
            if company_info:
                response = f"""お問い合わせいただき、ありがとうございます！

**会社概要**

"""
                for item in company_info:
                    response += f"{item['content']}\n\n"
                response += f"""{form_info}

**重要事項：**
• 上記の会社情報は当社の公式情報に基づいてお答えしています
• ホームページに記載されていない会社情報については、お答えできません
• より詳細な会社情報が必要な場合は、直接お問い合わせください
• 当社はお客様のビジネス成功をサポートすることを使命としています

ご不明な点や追加でお聞きになりたいことがございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""
                return response
        
        # その他の質問（高精度版）
        else:
            context = format_context(relevant_info)
            if context and context != "関連する情報が見つかりませんでした。":
                return f"""お問い合わせいただき、ありがとうございます！

{context}

上記の情報を参考に、お客様のご質問にお答えいたします。

{form_info}

**重要事項：**
• 上記の情報は当社の公式情報に基づいてお答えしています
• ホームページに記載されていない情報については、お答えできません
• より詳細な情報が必要な場合は、直接お問い合わせください
• 当社のサービス・料金・会社情報については、上記の内容をご参照ください

ご不明な点や追加でお聞きになりたいことがございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""
            else:
                # 関連情報が見つからない場合の制限された回答
                return f"""お問い合わせいただき、ありがとうございます！

申し訳ございませんが、お客様のご質問「{message}」について、当社のホームページに記載されている情報の中では、適切な回答を提供できません。

**当社がお答えできる情報：**
• 会社概要・代表者情報
• 提供サービス（AI導入コンサルティング、システム運用サポート、ECマーケティング支援、システム開発）
• 料金体系・お見積もり
• 連絡先・アクセス情報
• よくある質問（FAQ）

{form_info}

**お客様のご質問について：**
より具体的なご質問や、上記の情報に関する詳細なご相談がございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com"""

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
