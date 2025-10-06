/**
 * AI Chatbot Assistant for Contact Form
 * OpenAI API integration with form assistance features
 */

class ChatbotAssistant {
    constructor() {
        this.isOpen = false;
        this.isLoading = false;
        this.messages = [];
        this.apiEndpoint = '/api/chat'; // Vercel APIエンドポイント
        this.storageKey = 'chatbot_messages';
        this.isComposing = false; // 日本語変換状態を管理
        
        this.init();
    }

    /**
     * チャットボットの初期化
     */
    init() {
        this.createChatbotHTML();
        this.bindEvents();
        this.loadMessages();
        this.addInitialMessage();
        this.setupFormIntegration();
    }

    /**
     * チャットボットのHTML構造を作成
     */
    createChatbotHTML() {
        // メインコンテナ
        const chatbotContainer = document.createElement('div');
        chatbotContainer.className = 'chatbot-container';
        chatbotContainer.id = 'chatbot-container';
        chatbotContainer.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="chatbot-info">
                    <div class="chatbot-name">allgens</div>
                    <div class="chatbot-status">
                        <div class="status-dot"></div>
                        <span>オンライン</span>
                    </div>
                </div>
                <div class="chatbot-controls">
                    <button class="chatbot-restart" id="chatbot-restart" title="新しい会話を開始">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <!-- メッセージがここに追加されます -->
            </div>
            <div class="quick-actions" id="quick-actions">
                <button class="quick-action-btn" data-action="service-help">🤖 サービス選択のヘルプ</button>
                <button class="quick-action-btn" data-action="draft-message">✍️ メッセージ下書き</button>
                <button class="quick-action-btn" data-action="pricing-info">💰 料金について</button>
                <button class="quick-action-btn" data-action="contact-info">📞 連絡先情報</button>
                <button class="quick-action-btn" data-action="help">❓ 使い方ガイド</button>
            </div>
            <div class="chatbot-input-area">
                <div class="chatbot-input-container">
                    <textarea 
                        class="chatbot-input" 
                        id="chatbot-input" 
                        placeholder="メッセージを入力してください..."
                        rows="1"
                    ></textarea>
                    <button class="chatbot-send" id="chatbot-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // モバイル用フローティングボタン
        const floatingBtn = document.createElement('button');
        floatingBtn.className = 'chatbot-floating-btn';
        floatingBtn.id = 'chatbot-floating-btn';
        floatingBtn.innerHTML = '<i class="fas fa-comments"></i>';

        // モバイル用モーダル
        const modal = document.createElement('div');
        modal.className = 'chatbot-modal';
        modal.id = 'chatbot-modal';
        modal.innerHTML = `
            <div class="chatbot-modal-container">
                ${chatbotContainer.innerHTML}
            </div>
        `;

        // DOMに追加
        const desktopContainer = document.getElementById('chatbot-desktop');
        if (desktopContainer) {
            desktopContainer.appendChild(chatbotContainer);
        } else {
            document.body.appendChild(chatbotContainer);
        }
        document.body.appendChild(floatingBtn);
        document.body.appendChild(modal);
        
        // チャットボット再開用のフローティングボタン（デスクトップ用）
        this.createReopenButton();
    }

    /**
     * イベントリスナーの設定
     */
    bindEvents() {
        // 送信ボタン
        document.getElementById('chatbot-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // 入力フィールド（Enterキーで送信）
        document.getElementById('chatbot-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                // 日本語変換中（IME composition）の場合は送信しない
                if (e.isComposing || e.keyCode === 229) {
                    return;
                }
                e.preventDefault();
                this.sendMessage();
            }
        });

        // IME composition イベントの追加
        document.getElementById('chatbot-input').addEventListener('compositionstart', () => {
            this.isComposing = true;
        });

        document.getElementById('chatbot-input').addEventListener('compositionend', () => {
            this.isComposing = false;
        });

        // 入力フィールドの自動リサイズ
        document.getElementById('chatbot-input').addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
        });

        // クイックアクションボタン
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // 閉じるボタンは削除済み

        // 再起動ボタン
        document.getElementById('chatbot-restart').addEventListener('click', () => {
            this.restartChatbot();
        });

        // フローティングボタン（モバイル用）
        document.getElementById('chatbot-floating-btn').addEventListener('click', () => {
            this.toggleChatbot();
        });

        // モーダル背景クリックで閉じる
        document.getElementById('chatbot-modal').addEventListener('click', (e) => {
            if (e.target.id === 'chatbot-modal') {
                this.closeChatbot();
            }
        });

        // レスポンシブ対応
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * フォームとの連携設定
     */
    setupFormIntegration() {
        // フォームフィールドの変更を監視
        const formFields = ['name', 'company', 'email', 'phone', 'service', 'message'];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', () => {
                    this.analyzeFormData();
                });
                field.addEventListener('input', () => {
                    this.analyzeFormData();
                });
            }
        });
    }

    /**
     * フォームデータの分析と提案
     */
    analyzeFormData() {
        const formData = this.getFormData();
        
        // サービスが選択されていない場合の提案
        if (!formData.service) {
            this.suggestServiceSelection();
        }
        
        // メッセージが空の場合の提案
        if (!formData.message) {
            this.suggestMessageDraft();
        }
    }

    /**
     * フォームデータの取得
     */
    getFormData() {
        return {
            name: document.getElementById('name')?.value || '',
            company: document.getElementById('company')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            service: document.getElementById('service')?.value || '',
            message: document.getElementById('message')?.value || ''
        };
    }

    /**
     * サービス選択の提案
     */
    suggestServiceSelection() {
        // 既に提案済みかチェック
        if (this.hasRecentSuggestion('service-help')) return;
        
        const quickBtn = document.querySelector('[data-action="service-help"]');
        if (quickBtn) {
            quickBtn.style.animation = 'pulse 2s ease-in-out infinite';
            setTimeout(() => {
                quickBtn.style.animation = '';
            }, 6000);
        }
    }

    /**
     * メッセージ下書きの提案
     */
    suggestMessageDraft() {
        // 既に提案済みかチェック
        if (this.hasRecentSuggestion('draft-message')) return;
        
        const quickBtn = document.querySelector('[data-action="draft-message"]');
        if (quickBtn) {
            quickBtn.style.animation = 'pulse 2s ease-in-out infinite';
            setTimeout(() => {
                quickBtn.style.animation = '';
            }, 6000);
        }
    }

    /**
     * 最近の提案をチェック
     */
    hasRecentSuggestion(type) {
        const recent = localStorage.getItem(`chatbot_suggestion_${type}`);
        if (!recent) return false;
        
        const timeDiff = Date.now() - parseInt(recent);
        return timeDiff < 300000; // 5分以内
    }

    /**
     * 提案済みマーク
     */
    markSuggestionShown(type) {
        localStorage.setItem(`chatbot_suggestion_${type}`, Date.now().toString());
    }

    /**
     * 初期メッセージの追加
     */
    addInitialMessage() {
        if (this.messages.length === 0) {
            this.addMessage('ai', `こんにちは！AIアシスタントのallgensです 🤖

お問い合わせフォームの入力をお手伝いします！

📝 **こんなことができます：**
• サービス選択のアドバイス
• メッセージの下書き作成
• 料金・連絡先情報の案内
• フォーム入力のサポート

💡 **使い方：**
• メッセージを入力してEnterキーまたは送信ボタンをクリック
• 下のクイックアクションボタンをクリック
• フォームを入力すると自動でサポートします

何かお手伝いできることはありますか？`);
        }
    }

    /**
     * メッセージの追加
     */
    addMessage(sender, content, timestamp = null) {
        const message = {
            id: Date.now() + Math.random(),
            sender,
            content,
            timestamp: timestamp || new Date().toISOString()
        };

        this.messages.push(message);
        this.renderMessage(message);
        this.saveMessages();
        this.scrollToBottom();
    }

    /**
     * メッセージのレンダリング
     */
    renderMessage(message) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender}`;
        messageElement.dataset.messageId = message.id;

        const time = new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${message.sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-bubble">
                <div class="message-content">${this.formatMessage(message.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
    }

    /**
     * メッセージのフォーマット
     */
    formatMessage(content) {
        // 改行を<br>に変換
        return content.replace(/\n/g, '<br>');
    }

    /**
     * メッセージの送信
     */
    async sendMessage(message = null) {
        const input = document.getElementById('chatbot-input');
        
        // メッセージが指定されていない場合は入力フィールドから取得
        if (!message) {
            message = input.value.trim();
            if (!message || this.isLoading) return;

            // ユーザーメッセージを追加
            this.addMessage('user', message);
            input.value = '';
            this.autoResizeTextarea(input);
        }

        // ローディング状態
        this.setLoading(true);
        this.showTypingIndicator();

        try {
            console.log('🚀 Sending message:', message);
            // AI応答を取得
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage('ai', response);
            console.log('✅ AI Response received:', response.substring(0, 100) + '...');
        } catch (error) {
            this.hideTypingIndicator();
            console.error('❌ Chatbot API Error:', error);
            this.addMessage('ai', '申し訳ございません。現在、AIアシスタントに接続できません。しばらく時間をおいてから再度お試しください。');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * AI応答の取得
     * VercelのAPIエンドポイントを呼び出してAI応答を生成
     */
    async getAIResponse(message) {
        const formData = this.getFormData();
        
        // APIリクエスト用のデータを準備
        const requestBody = {
            message: message,
            formData: formData,
            context: 'contact_form_assistance'
        };

        try {
            console.log('🤖 AI API Request:', { 
                endpoint: this.apiEndpoint, 
                message: message.substring(0, 50) + '...', 
                formData: formData 
            });

            // デバッグ用：APIエンドポイントの存在確認
            console.log('🔍 Checking API endpoint availability...');
            
            // VercelのAPIエンドポイントにPOSTリクエストを送信
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 API Response Status:', response.status, response.statusText);

            // レスポンスのステータスをチェック
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', response.status, errorText);
                
                // 詳細なエラー情報を表示（一時的なメッセージ）
                this.showErrorMessage(`API接続エラー (${response.status})`);
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            // レスポンスデータを取得
            const data = await response.json();
            console.log('✅ AI API Response:', data);

            // レスポンス形式をチェック（Vercel形式とローカルモック形式の両方に対応）
            if (data.success && data.message) {
                // Vercel API形式
                console.log('🎉 AI Response received (Vercel format):', data.message.substring(0, 100) + '...');
                return data.message;
            } else if (data.response) {
                // ローカルモックAPI形式
                console.log('🎉 AI Response received (Local mock format):', data.response.substring(0, 100) + '...');
                return data.response;
            } else {
                console.error('❌ Invalid response format:', data);
                throw new Error('Invalid response format from AI API');
            }

        } catch (error) {
            console.error('💥 AI API Error:', error);
            
            // エラーの種類に応じてメッセージを変更
            let errorMessage = 'AI応答の取得中にエラーが発生しました。';
            if (error.message.includes('fetch')) {
                errorMessage = 'ネットワークエラー: APIサーバーに接続できません。';
            } else if (error.message.includes('404')) {
                errorMessage = 'APIエンドポイントが見つかりません。Vercelの設定を確認してください。';
            } else if (error.message.includes('500')) {
                errorMessage = 'サーバーエラー: OpenAI APIキーの設定を確認してください。';
            }
            
            // エラーメッセージを表示しない（フォールバック応答を静かに表示）
            console.warn('⚠️ Using fallback response:', errorMessage);
            
            // フォールバック応答（APIが利用できない場合）
            return this.getFallbackResponse(message, formData);
        }
    }

    /**
     * フォールバック応答（AI APIが利用できない場合）
     */
    getFallbackResponse(message, formData) {
        console.log('🔄 Using fallback response for:', message);
        
        // ローカルのAI関数があれば使用
        if (typeof window.ChatbotAI !== 'undefined') {
            return window.ChatbotAI.generateFallbackResponse(message, formData);
        }
        
        // 基本的なフォールバック応答
        return this.getMockResponse(message, formData);
    }

    /**
     * モック応答（開発・テスト用）
     */
    getMockResponse(message, formData) {
        const lowerMessage = message.toLowerCase();

        // サービス関連の質問
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

        // 料金関連の質問
        if (lowerMessage.includes('料金') || lowerMessage.includes('価格') || lowerMessage.includes('費用')) {
            return `料金については、プロジェクトの規模や内容により異なります。

📋 **初回相談は無料**で承っております
💰 **お見積もり**は個別にご提案いたします
📞 **詳細**はお気軽にお問い合わせください

お客様のご要望をお聞かせいただければ、最適なプランをご提案いたします。`;
        }

        // 連絡先関連の質問
        if (lowerMessage.includes('連絡先') || lowerMessage.includes('電話') || lowerMessage.includes('メール')) {
            return `📞 **電話番号**: 03-1234-5678
📧 **メール**: info@allgens.co.jp
🕒 **営業時間**: 平日 9:00-18:00
📍 **所在地**: 東京都千代田区千代田1-1-1

お気軽にお問い合わせください！`;
        }

        // フォーム入力のヘルプ
        if (lowerMessage.includes('フォーム') || lowerMessage.includes('入力') || lowerMessage.includes('記入')) {
            return `お問い合わせフォームの入力についてサポートいたします！

📝 **入力のコツ**:
- お名前とメールアドレスは必須項目です
- 会社名は任意ですが、記載いただくとより具体的なご提案ができます
- お問い合わせ内容は具体的にご記入ください

💡 **サービス選択でお悩みの場合は**、お客様の業界や課題をお教えください。最適なサービスをご提案いたします。

何かご不明な点がございましたら、お気軽にお尋ねください！`;
        }

        // 挨拶パターン
        if (lowerMessage.includes('こんにちは') || lowerMessage.includes('はじめまして') || lowerMessage.includes('初めまして')) {
            return `こんにちは！allgensのAIアシスタントです 😊

お問い合わせフォームの入力をお手伝いさせていただきます。

どのようなご用件でしょうか？サービスについてのご質問や、フォーム入力でお困りのことがあれば、お気軽にお聞かせください！`;
        }

        // 感謝の表現
        if (lowerMessage.includes('ありがとう') || lowerMessage.includes('助かりました') || lowerMessage.includes('参考になりました')) {
            return `どういたしまして！お役に立てて嬉しいです 😊

他にもご質問やお困りのことがございましたら、いつでもお声かけください。

フォームの入力が完了しましたら、ぜひ送信してくださいね！`;
        }

        // 時間・スケジュール関連
        if (lowerMessage.includes('いつ') || lowerMessage.includes('期間') || lowerMessage.includes('スケジュール') || lowerMessage.includes('いつまで')) {
            return `プロジェクトのスケジュールについてお答えします！

⏰ **導入期間の目安**
- 小規模プロジェクト: 1-3ヶ月
- 中規模プロジェクト: 3-6ヶ月
- 大規模プロジェクト: 6ヶ月以上

📅 **スケジュールの流れ**
1. 初回相談（無料）
2. 詳細ヒアリング
3. 提案書作成
4. 契約・プロジェクト開始
5. 開発・導入
6. 運用開始・サポート

💡 **お客様のご都合に合わせて調整可能**
- 段階的な導入も可能
- 既存システムとの連携も考慮

まずは初回相談で、お客様のご要望をお聞かせください！`;
        }

        // 技術的な質問
        if (lowerMessage.includes('技術') || lowerMessage.includes('システム') || lowerMessage.includes('開発') || lowerMessage.includes('プログラミング')) {
            return `技術的なご質問にお答えします！

💻 **開発技術**
- フロントエンド: React, Vue.js, Angular
- バックエンド: Node.js, Python, PHP, Java
- データベース: MySQL, PostgreSQL, MongoDB
- クラウド: AWS, Azure, GCP

🤖 **AI・機械学習**
- 自然言語処理
- 画像認識
- 予測分析
- レコメンデーションシステム

⚙️ **システム運用**
- 監視・ログ管理
- セキュリティ対策
- パフォーマンス最適化
- バックアップ・災害対策

お客様のご要望に応じて、最適な技術スタックをご提案いたします！`;
        }

        // デフォルト応答（より自然で多様に）
        const responses = [
            `ありがとうございます！お問い合わせ内容を確認いたします。

お客様のご要望に合わせて、最適なソリューションをご提案いたします。

💡 **お手伝いできること：**
• サービス選択のアドバイス
• メッセージの下書き作成
• 料金・連絡先情報の案内
• フォーム入力のサポート

具体的なご質問やご不明な点がございましたら、お気軽にお尋ねください。初回相談は無料で承っております。`,

            `お問い合わせいただき、ありがとうございます！

allgensでは、お客様のビジネス課題を解決するための様々なサービスを提供しています。

🤖 **AI導入コンサルティング**で業務効率化
⚙️ **システム運用サポート**で安定稼働
🛒 **ECマーケティング支援**で売上向上
💻 **システム開発**でカスタムソリューション

どのようなお悩みがございますか？お気軽にご相談ください！`,

            `こんにちは！allgensのAIアシスタントです。

お客様のビジネスをサポートするために、いつでもお手伝いさせていただきます。

📝 **フォーム入力でお困りのことがあれば**
• 下のクイックアクションボタンをご利用ください
• メッセージ下書きの自動生成も可能です

💬 **ご質問がございましたら**
• サービス内容について
• 料金・スケジュールについて
• 技術的なご相談

何でもお気軽にお聞かせください！`
        ];

        // ランダムに応答を選択
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
    }

    /**
     * クイックアクションの処理
     */
    async handleQuickAction(action) {
        console.log('🎯 Quick action triggered:', action);
        this.markSuggestionShown(action);

        switch (action) {
            case 'service-help':
                console.log('📋 Processing service-help action');
                this.addMessage('user', 'サービス選択について教えてください');
                await this.sendMessage('サービス選択について教えてください');
                break;
            case 'draft-message':
                console.log('📝 Processing draft-message action');
                this.generateMessageDraft();
                break;
            case 'pricing-info':
                console.log('💰 Processing pricing-info action');
                this.addMessage('user', '料金について教えてください');
                await this.sendMessage('料金について教えてください');
                break;
            case 'contact-info':
                console.log('📞 Processing contact-info action');
                this.addMessage('user', '連絡先情報を教えてください');
                await this.sendMessage('連絡先情報を教えてください');
                break;
            case 'help':
                console.log('❓ Processing help action');
                this.showHelpGuide();
                break;
        }
    }

    /**
     * メッセージ下書きの生成
     */
    generateMessageDraft() {
        const formData = this.getFormData();
        
        if (!formData.name && !formData.company) {
            this.addMessage('ai', 'お名前や会社名を入力していただくと、より具体的な下書きを作成できます。');
            return;
        }

        let draft;
        
        // ローカルのAI関数があれば使用
        if (typeof window.ChatbotAI !== 'undefined') {
            draft = window.ChatbotAI.generateMessageDraft(formData);
        } else {
            // 基本的な下書き生成
            draft = this.generateBasicDraft(formData);
        }

        // フォームのメッセージ欄に挿入
        const messageField = document.getElementById('message');
        if (messageField) {
            messageField.value = draft;
            messageField.focus();
        }

        this.addMessage('ai', 'メッセージの下書きを作成しました。フォームの「お問い合わせ内容」欄に挿入いたします。必要に応じて編集してください。');
    }

    /**
     * 基本的な下書き生成
     */
    generateBasicDraft(formData) {
        let draft = `お世話になっております。`;
        
        if (formData.company) {
            draft += `\n${formData.company}の${formData.name}と申します。`;
        } else if (formData.name) {
            draft += `\n${formData.name}と申します。`;
        }

        draft += `\n\nこの度は、貴社のサービスについてお問い合わせさせていただきたく、`;
        draft += `\nご連絡いたしました。`;

        if (formData.service) {
            const serviceNames = {
                'ai': 'AI導入コンサルティング',
                'system': 'システム運用サポート',
                'ec': 'ECマーケティング支援',
                'development': 'システム開発',
                'other': 'その他'
            };
            draft += `\n\n特に${serviceNames[formData.service] || formData.service}について`;
            draft += `\nご相談がございます。`;
        }

        draft += `\n\n詳細につきましては、お時間のある際に`;
        draft += `\nご連絡いただけますと幸いです。`;
        draft += `\n\n何卒よろしくお願いいたします。`;

        return draft;
    }

    /**
     * タイピングインジケーターの表示
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingElement = document.createElement('div');
        typingElement.className = 'message ai typing-message';
        typingElement.id = 'typing-indicator';
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-indicator">
                <div class="typing-text">AIが考え中です</div>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    /**
     * タイピングインジケーターの非表示
     */
    hideTypingIndicator() {
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    /**
     * ローディング状態の設定
     */
    setLoading(loading) {
        this.isLoading = loading;
        const sendBtn = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');
        
        if (loading) {
            sendBtn.disabled = true;
            input.disabled = true;
            sendBtn.classList.add('loading');
        } else {
            sendBtn.disabled = false;
            input.disabled = false;
            sendBtn.classList.remove('loading');
        }
    }

    /**
     * テキストエリアの自動リサイズ
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    /**
     * チャットボットの開閉
     */
    toggleChatbot() {
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }

    /**
     * チャットボットを開く
     */
    openChatbot() {
        this.isOpen = true;
        
        if (window.innerWidth <= 768) {
            // モバイル表示
            document.getElementById('chatbot-modal').classList.add('active');
            document.getElementById('chatbot-floating-btn').classList.add('active');
        } else {
            // デスクトップ表示
            const container = document.getElementById('chatbot-container');
            if (container) {
                container.style.display = 'flex';
                container.classList.add('animate-in');
            }
        }
    }

    /**
     * チャットボットを閉じる
     */
    closeChatbot() {
        this.isOpen = false;
        
        if (window.innerWidth <= 768) {
            // モバイル表示
            document.getElementById('chatbot-modal').classList.remove('active');
            document.getElementById('chatbot-floating-btn').classList.remove('active');
        } else {
            // デスクトップ表示
            const container = document.getElementById('chatbot-container');
            if (container) {
                container.style.display = 'none';
            }
            // 再開ボタンを表示
            this.showReopenButton();
        }
    }

    /**
     * リサイズ処理
     */
    handleResize() {
        if (window.innerWidth > 768) {
            // デスクトップ表示に切り替え
            document.getElementById('chatbot-modal').classList.remove('active');
            if (this.isOpen) {
                const container = document.getElementById('chatbot-container');
                if (container) {
                    container.style.display = 'flex';
                }
            }
        } else {
            // モバイル表示に切り替え
            const container = document.getElementById('chatbot-container');
            if (container) {
                container.style.display = 'none';
            }
            if (this.isOpen) {
                document.getElementById('chatbot-modal').classList.add('active');
            }
        }
    }

    /**
     * 最下部にスクロール
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * メッセージの保存
     */
    saveMessages() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
        } catch (error) {
            console.warn('Failed to save messages to localStorage:', error);
        }
    }

    /**
     * メッセージの読み込み
     */
    loadMessages() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.messages = JSON.parse(saved);
                this.renderAllMessages();
            }
        } catch (error) {
            console.warn('Failed to load messages from localStorage:', error);
            this.messages = [];
        }
    }

    /**
     * 全メッセージのレンダリング
     */
    renderAllMessages() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.innerHTML = '';
        
        this.messages.forEach(message => {
            this.renderMessage(message);
        });
    }

    /**
     * メッセージ履歴のクリア
     */
    clearHistory() {
        this.messages = [];
        localStorage.removeItem(this.storageKey);
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.innerHTML = '';
        this.addInitialMessage();
    }

    /**
     * チャットボットの再起動
     */
    restartChatbot() {
        // 確認ダイアログ
        if (confirm('会話履歴をクリアして新しい会話を開始しますか？')) {
            this.clearHistory();
            this.scrollToBottom();
            
            // 成功メッセージを一時的に表示
            const messagesContainer = document.getElementById('chatbot-messages');
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = '✅ 新しい会話を開始しました！';
            messagesContainer.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        }
    }

    /**
     * ヘルプガイドの表示
     */
    showHelpGuide() {
        this.addMessage('ai', `📖 **AIチャットボット使い方ガイド**

🤖 **基本操作**
• メッセージを入力してEnterキーまたは📤ボタンで送信
• 下のクイックアクションボタンをクリック
• フォームを入力すると自動でサポートします

💡 **主な機能**
• **🤖 サービス選択のヘルプ**: 最適なサービスを提案
• **✍️ メッセージ下書き**: 自動でメッセージを作成
• **💰 料金について**: 料金プランや見積もりの案内
• **📞 連絡先情報**: 電話番号やメールアドレス
• **🔄 再起動**: 右上の🔄ボタンで新しい会話を開始

🎯 **便利な使い方**
• フォームの入力フィールドを変更すると自動でサポート
• よくある質問はクイックアクションから
• 会話履歴は自動で保存されます

何かご不明な点がございましたら、お気軽にお尋ねください！`);
    }

    /**
     * エラーメッセージの表示
     * API接続エラーなどの一時的なメッセージを表示
     */
    showErrorMessage(message) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.innerHTML = `⚠️ ${message}`;
        
        // メッセージの最後に追加
        messagesContainer.appendChild(errorMsg);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (errorMsg.parentNode) {
                errorMsg.remove();
            }
        }, 3000);
        
        // 最下部にスクロール
        this.scrollToBottom();
    }

    /**
     * 再開ボタンの作成
     */
    createReopenButton() {
        const reopenBtn = document.createElement('button');
        reopenBtn.className = 'chatbot-reopen-btn';
        reopenBtn.id = 'chatbot-reopen-btn';
        reopenBtn.innerHTML = `
            <div class="reopen-btn-content">
                <i class="fas fa-comments"></i>
                <span>AIアシスタント</span>
            </div>
            <div class="reopen-btn-pulse"></div>
        `;
        
        reopenBtn.addEventListener('click', () => {
            this.openChatbot();
            this.hideReopenButton();
        });
        
        document.body.appendChild(reopenBtn);
        
        // 最初は非表示
        reopenBtn.style.display = 'none';
    }

    /**
     * 再開ボタンの表示
     */
    showReopenButton() {
        const reopenBtn = document.getElementById('chatbot-reopen-btn');
        if (reopenBtn) {
            setTimeout(() => {
                reopenBtn.style.display = 'flex';
                reopenBtn.classList.add('animate-in');
            }, 500); // 少し遅延させて自然な表示
        }
    }

    /**
     * 再開ボタンの非表示
     */
    hideReopenButton() {
        const reopenBtn = document.getElementById('chatbot-reopen-btn');
        if (reopenBtn) {
            reopenBtn.classList.remove('animate-in');
            reopenBtn.style.display = 'none';
        }
    }
}

// ページ読み込み完了後にチャットボットを初期化
document.addEventListener('DOMContentLoaded', () => {
    // チャットボットの初期化
    window.chatbot = new ChatbotAssistant();
    
    // デバッグ用（開発時のみ）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.chatbot.clearHistory = window.chatbot.clearHistory.bind(window.chatbot);
        console.log('Chatbot initialized. Use window.chatbot.clearHistory() to clear message history.');
    }
});

// エクスポート（モジュール環境用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotAssistant;
}
