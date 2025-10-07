/**
 * GitHub Pages用チャットボット
 * 外部APIサービスを使用してAI応答を生成
 */

class ChatbotAssistantGitHubPages {
    constructor() {
        this.isOpen = false;
        this.isLoading = false;
        this.messages = [];
        this.storageKey = 'chatbot_messages';
        
        // 外部APIサービス（例：OpenAI APIを直接呼び出し）
        this.externalApiUrl = 'https://api.openai.com/v1/chat/completions';
        this.apiKey = 'your-openai-api-key-here'; // 注意：セキュリティ上推奨されない
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.createChatbotHTML();
        this.bindEvents();
        this.loadMessages();
        this.addInitialMessage();
        this.setupFormIntegration();
    }

    /**
     * AI応答の取得（外部API直接呼び出し）
     */
    async getAIResponse(message) {
        const formData = this.getFormData();
        
        try {
            console.log('🤖 Calling external AI API...');
            
            // 注意：この方法はセキュリティ上推奨されません
            // APIキーがフロントエンドに露出してしまいます
            const response = await fetch(this.externalApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: this.buildSystemPrompt(formData)
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.warn('External API failed, using fallback:', error);
            return this.getFallbackResponse(message, formData);
        }
    }

    /**
     * システムプロンプトの構築
     */
    buildSystemPrompt(formData) {
        return `あなたはAIアシスタントです。お問い合わせフォームの入力サポートを担当しています。

【企業情報】
- 会社名: TechCorp
- 連絡先: 03-1234-5678 / contact@example.com
- 営業時間: 平日 9:00-18:00

【提供サービス】
- AI導入コンサルティング
- システム運用サポート
- ECマーケティング支援
- システム開発

【現在のフォーム入力状況】
- お名前: ${formData.name || '未入力'}
- 会社名: ${formData.company || '未入力'}
- メールアドレス: ${formData.email || '未入力'}
- 電話番号: ${formData.phone || '未入力'}
- サービス: ${this.getServiceName(formData.service) || '未選択'}
- お問い合わせ内容: ${formData.message || '未入力'}

【応答方針】
1. 親切で丁寧な日本語で応答
2. 絵文字を適度に使用して親しみやすく
3. フォーム入力の進捗に応じて適切なアドバイス
4. サービス選択や料金に関する質問には具体的に回答
5. メッセージ下書きの作成をサポート
6. 長すぎず、読みやすい形式で回答`;
    }

    /**
     * サービス名を取得
     */
    getServiceName(serviceKey) {
        const services = {
            'ai': 'AI導入コンサルティング',
            'system': 'システム運用サポート',
            'ec': 'ECマーケティング支援',
            'development': 'システム開発',
            'other': 'その他'
        };
        return services[serviceKey] || null;
    }

    /**
     * フォールバック応答
     */
    getFallbackResponse(message, formData) {
        // 既存のフォールバック応答ロジックを使用
        return this.getMockResponse(message, formData);
    }

    /**
     * モック応答（既存のロジックを使用）
     */
    getMockResponse(message, formData) {
        // 既存のgetMockResponseメソッドの内容をここにコピー
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('サービス') || lowerMessage.includes('service')) {
            return `当社では以下のサービスを提供しています：

🤖 **AI導入コンサルティング**
- 業務プロセスの自動化
- AI活用戦略の立案

⚙️ **システム運用サポート**
- 24時間365日の監視
- 障害対応とメンテナンス

🛒 **ECマーケティング支援**
- オンライン販売の最適化
- マーケティング戦略の立案

💻 **システム開発**
- カスタムシステムの開発
- 既存システムの改修

どのサービスにご興味がございますか？`;
        }

        // その他の応答パターン...
        return `ありがとうございます！お問い合わせ内容を確認いたします。

お客様のご要望に合わせて、最適なソリューションをご提案いたします。

💡 **お手伝いできること：**
• サービス選択のアドバイス
• メッセージの下書き作成
• 料金・連絡先情報の案内
• フォーム入力のサポート

具体的なご質問やご不明な点がございましたら、お気軽にお尋ねください。初回相談は無料で承っております。`;
    }

    // その他のメソッドは既存のChatbotAssistantクラスと同じ
    // （createChatbotHTML, bindEvents, loadMessages等）
}

// 既存のChatbotAssistantクラスのメソッドをコピーして使用
