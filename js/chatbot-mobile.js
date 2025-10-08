/**
 * Mobile-Optimized Chatbot Assistant
 * Simplified implementation for mobile compatibility
 */

(function() {
    'use strict';
    
    let chatbot = {
        isOpen: false,
        isLoading: false,
        messages: [],
        apiEndpoint: '/api/chat',
        storageKey: 'chatbot_messages',
        sizeStorageKey: 'chatbot_size',
        currentSize: 'compact',
        savedScrollY: 0,
        // Mobile対応箇所: デバッグ用の設定
        debugMode: true,
        // Mobile対応箇所: クイックアクション表示状態
        quickActionsVisible: true
    };

    // 初期化関数
    function initChatbot() {
        console.log('🚀 Mobile Chatbot: Initializing...');
        
        // HTMLを作成
        createChatbotHTML();
        
        // イベントリスナーを設定
        bindEvents();
        
        // 初期メッセージを追加
        addInitialMessage();
        
        console.log('✅ Mobile Chatbot: Initialized successfully');
    }

    // HTML作成
    function createChatbotHTML() {
        const chatbotHTML = `
            <div id="chatbot-container" class="chatbot-container compact">
                <div class="chatbot-header">
                    <div class="chatbot-header-left">
                        <i class="fas fa-robot"></i>
                        <div class="chatbot-name">AI Assistant</div>
                        <div class="chatbot-status online">
                            <span class="status-dot"></span>
                            オンライン
                        </div>
                    </div>
                    <div class="chatbot-controls">
                        <button class="chatbot-control-btn" id="chatbot-quick-toggle" title="クイックアクション">
                            <i class="fas fa-th-list"></i>
                        </button>
                        <button class="chatbot-control-btn" id="chatbot-restart" title="会話をリセット">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="chatbot-size-toggle" id="chatbot-size-toggle" title="チャットボットを閉じる">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="chatbot-messages" id="chatbot-messages">
                    <!-- メッセージがここに表示される -->
                </div>
                
                <div class="quick-actions" id="quick-actions">
                    <button class="quick-action-btn" data-action="service-help">
                        <i class="fas fa-robot"></i>
                        サービス
                    </button>
                    <button class="quick-action-btn" data-action="draft-message">
                        <i class="fas fa-edit"></i>
                        メモ
                    </button>
                    <button class="quick-action-btn" data-action="pricing-help">
                        <i class="fas fa-dollar-sign"></i>
                        料金
                    </button>
                    <button class="quick-action-btn" data-action="contact-info">
                        <i class="fas fa-phone"></i>
                        連絡
                    </button>
                    <button class="quick-action-btn" data-action="usage-help">
                        <i class="fas fa-question-circle"></i>
                        使い方
                    </button>
                </div>
                
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
            
            <button class="chatbot-floating-btn" id="chatbot-floating-btn">
                <i class="fas fa-comments"></i>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        console.log('📝 Mobile Chatbot: HTML created');
    }

    // イベントリスナー設定
    function bindEvents() {
        console.log('🔗 Mobile Chatbot: Binding events...');
        
        // フローティングボタン
        const floatingBtn = document.getElementById('chatbot-floating-btn');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', toggleChatbot);
            floatingBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                toggleChatbot();
            });
            console.log('✅ Floating button events bound');
        }

        // 送信ボタン
        const sendBtn = document.getElementById('chatbot-send');
        if (sendBtn) {
            // クリックイベント
            sendBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📤 Send button clicked');
                sendMessage();
            });
            
            // タッチイベント
            sendBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                sendBtn.style.opacity = '0.7';
            });
            
            sendBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                sendBtn.style.opacity = '1';
                console.log('📤 Send button touched');
                sendMessage();
            });
            
            console.log('✅ Send button events bound');
        }

        // 入力フィールド
        const input = document.getElementById('chatbot-input');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            input.addEventListener('input', function(e) {
                autoResizeTextarea(e.target);
            });
            
            console.log('✅ Input field events bound');
        }

        // クイックアクションボタン
        const quickActions = document.querySelectorAll('.quick-action-btn');
        console.log('🔘 Found quick action buttons:', quickActions.length);
        
        quickActions.forEach(function(btn, index) {
            console.log('Setting up button', index, ':', btn.dataset.action);
            
            // クリックイベント
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 Quick action clicked:', btn.dataset.action);
                handleQuickAction(btn.dataset.action);
            });
            
            // タッチイベント
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                btn.style.opacity = '0.7';
            });
            
            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                btn.style.opacity = '1';
                console.log('🔘 Quick action touched:', btn.dataset.action);
                handleQuickAction(btn.dataset.action);
            });
        });

        // クイックアクション表示/非表示ボタン
        const quickToggle = document.getElementById('chatbot-quick-toggle');
        if (quickToggle) {
            quickToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📋 Quick actions toggle clicked');
                toggleQuickActions();
            });
            
            quickToggle.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                quickToggle.style.opacity = '0.7';
            });
            
            quickToggle.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                quickToggle.style.opacity = '1';
                console.log('📋 Quick actions toggle touched');
                toggleQuickActions();
            });
            
            console.log('✅ Quick actions toggle events bound');
        }

        // サイズ切り替えボタン
        const sizeToggle = document.getElementById('chatbot-size-toggle');
        if (sizeToggle) {
            sizeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📏 Size toggle clicked');
                toggleSize();
            });
            
            sizeToggle.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                sizeToggle.style.opacity = '0.7';
            });
            
            sizeToggle.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                sizeToggle.style.opacity = '1';
                console.log('📏 Size toggle touched');
                toggleSize();
            });
            
            console.log('✅ Size toggle events bound');
        }

        // リセットボタン
        const resetBtn = document.getElementById('chatbot-restart');
        if (resetBtn) {
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Reset button clicked');
                clearMessages();
            });
            
            resetBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                resetBtn.style.opacity = '0.7';
            });
            
            resetBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                resetBtn.style.opacity = '1';
                console.log('🔄 Reset button touched');
                clearMessages();
            });
            
            console.log('✅ Reset button events bound');
        }

        // Mobile対応箇所: チャットボット内のスクロールイベントを制御
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer) {
            messagesContainer.addEventListener('touchmove', function(e) {
                // チャットボット内でのスクロールは許可
                e.stopPropagation();
            }, { passive: false });
            
            messagesContainer.addEventListener('wheel', function(e) {
                // マウスホイールでのスクロールも制御
                e.stopPropagation();
            }, { passive: false });
            
            console.log('✅ Chatbot scroll events controlled');
        }

        // Mobile対応箇所: チャットボット全体でのタッチイベント制御
        const chatbotContainer = document.getElementById('chatbot-container');
        if (chatbotContainer) {
            chatbotContainer.addEventListener('touchmove', function(e) {
                // チャットボット内でのタッチは背景に伝播させない
                e.stopPropagation();
            }, { passive: false });
            
            console.log('✅ Chatbot container touch events controlled');
        }

        console.log('✅ Mobile Chatbot: All events bound successfully');
    }

    // チャットボットの表示/非表示
    function toggleChatbot() {
        console.log('🔄 Toggling chatbot...');
        chatbot.isOpen = !chatbot.isOpen;
        const container = document.getElementById('chatbot-container');
        const floatingBtn = document.getElementById('chatbot-floating-btn');
        
        if (chatbot.isOpen) {
            container.style.display = 'block';
            floatingBtn.style.display = 'none';
            // Mobile対応箇所: 背景スクロールを防止
            preventBackgroundScroll(true);
            console.log('✅ Chatbot opened');
        } else {
            container.style.display = 'none';
            floatingBtn.style.display = 'flex';
            // Mobile対応箇所: 背景スクロールを有効化
            preventBackgroundScroll(false);
            console.log('✅ Chatbot closed');
        }
    }

    // 背景スクロールの制御
    function preventBackgroundScroll(prevent) {
        if (prevent) {
            // 現在のスクロール位置を保存
            chatbot.savedScrollY = window.scrollY;
            // 背景スクロールを防止
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${chatbot.savedScrollY}px`;
            console.log('🚫 Background scroll prevented');
        } else {
            // 背景スクロールを有効化
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            // スクロール位置を復元
            window.scrollTo(0, chatbot.savedScrollY);
            console.log('✅ Background scroll enabled');
        }
    }

    // メッセージ送信
    function sendMessage(message) {
        console.log('📤 Sending message...');
        
        const input = document.getElementById('chatbot-input');
        
        if (!message) {
            message = input.value.trim();
            if (!message || chatbot.isLoading) {
                console.log('❌ No message or loading, returning');
                return;
            }
            
            addMessage('user', message);
            input.value = '';
            autoResizeTextarea(input);
        }

        chatbot.isLoading = true;
        setLoading(true);
        showTypingIndicator();

        // API呼び出し
        console.log('📡 API Request to:', chatbot.apiEndpoint);
        console.log('📤 Request data:', { message, messages: chatbot.messages });
        
        fetch(chatbot.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                messages: chatbot.messages
            })
        })
        .then(response => {
            console.log('📨 Response status:', response.status);
            console.log('📨 Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        })
        .then(data => {
            console.log('📨 API Response:', data);
            hideTypingIndicator();
            
            if (data.response) {
                addMessage('assistant', data.response);
            } else if (data.error) {
                addMessage('assistant', `エラー: ${data.error}`);
            } else {
                addMessage('assistant', '申し訳ございません。現在サーバーに接続できません。');
            }
        })
        .catch(error => {
            console.error('❌ API Error:', error);
            console.error('❌ Error details:', error.message);
            hideTypingIndicator();
            
            // Mobile対応箇所: フォールバック応答を生成
            const fallbackResponse = generateFallbackResponse(message);
            addMessage('assistant', fallbackResponse);
        })
        .finally(() => {
            chatbot.isLoading = false;
            setLoading(false);
        });
    }

    // メッセージ追加
    function addMessage(type, content) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = formatMessage(content);
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        chatbot.messages.push({ type, content });
        console.log('💬 Message added:', type, content.substring(0, 50));
    }

    // メッセージフォーマット
    function formatMessage(content) {
        let formatted = content;
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
        formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    // クイックアクション処理
    function handleQuickAction(action) {
        console.log('🎯 Handling quick action:', action);
        
        const messages = {
            'service-help': 'サービス選択について教えてください',
            'draft-message': 'メッセージの下書きについて教えてください',
            'pricing-help': '料金について教えてください',
            'contact-info': '連絡先について教えてください',
            'usage-help': '使い方について教えてください'
        };
        
        const message = messages[action];
        if (message) {
            addMessage('user', message);
            sendMessage(message);
        }
    }

    // クイックアクションの表示/非表示
    function toggleQuickActions() {
        console.log('📋 Toggling quick actions...');
        chatbot.quickActionsVisible = !chatbot.quickActionsVisible;
        const quickActions = document.getElementById('quick-actions');
        const quickToggle = document.getElementById('chatbot-quick-toggle');
        const icon = quickToggle.querySelector('i');
        
        if (chatbot.quickActionsVisible) {
            quickActions.style.display = 'flex';
            icon.className = 'fas fa-th-list';
            quickToggle.title = 'クイックアクションを非表示';
            console.log('✅ Quick actions shown');
        } else {
            quickActions.style.display = 'none';
            icon.className = 'fas fa-th-list';
            quickToggle.title = 'クイックアクションを表示';
            console.log('✅ Quick actions hidden');
        }
    }

    // 表示形式切り替え（チャットボットの開閉）
    function toggleSize() {
        console.log('📏 Toggling display mode...');
        // Mobile対応箇所: サイズ変更ではなく、チャットボットを閉じる
        toggleChatbot();
    }

    // ローディング状態設定
    function setLoading(loading) {
        const sendBtn = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');
        
        if (loading) {
            sendBtn.disabled = true;
            input.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            sendBtn.disabled = false;
            input.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    // タイピングインジケーター表示
    function showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message-bubble assistant typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // タイピングインジケーター非表示
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // テキストエリア自動リサイズ
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // メッセージクリア
    function clearMessages() {
        chatbot.messages = [];
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.innerHTML = '';
        addInitialMessage();
    }

    // 初期メッセージ追加
    function addInitialMessage() {
        const welcomeMessage = `こんにちは！AIアシスタントです。

何かお手伝いできることはありますか？以下のクイックアクションからお選びいただくか、自由にメッセージをお送りください。`;
        
        addMessage('assistant', welcomeMessage);
        
        // Mobile対応箇所: 接続テストを実行
        testConnection();
    }

    // フォールバック応答生成
    function generateFallbackResponse(message) {
        console.log('🔄 Generating fallback response for:', message);
        
        const messageLower = message.toLowerCase();
        
        // サービス関連の質問
        if (messageLower.includes('サービス') || messageLower.includes('service')) {
            return `**サービスについて**

当社では以下のサービスを提供しています：

• **システム開発**: Webアプリケーション、モバイルアプリの開発
• **AI導入支援**: チャットボット、データ分析システムの構築
• **ECマーケティング**: オンラインショップの運営支援
• **システム運用**: サーバー管理、セキュリティ対策

詳細については、お気軽にお問い合わせください。`;
        }
        
        // 料金関連の質問
        if (messageLower.includes('料金') || messageLower.includes('価格') || messageLower.includes('費用')) {
            return `**料金について**

料金はご要望に応じて個別にお見積もりいたします。

• **初回相談**: 無料
• **システム開発**: 規模により変動
• **運用サポート**: 月額制プランあり

具体的なご要望をお聞かせいただければ、詳細なお見積もりをご提示いたします。`;
        }
        
        // 連絡先関連の質問
        if (messageLower.includes('連絡') || messageLower.includes('連絡先') || messageLower.includes('電話')) {
            return `**連絡先情報**

📞 **電話**: 03-1234-5678  
📧 **メール**: contact@example.com  
🌐 **ウェブサイト**: https://example.com

営業時間: 平日 9:00-18:00

お気軽にお問い合わせください。`;
        }
        
        // 使い方関連の質問
        if (messageLower.includes('使い方') || messageLower.includes('使い方') || messageLower.includes('使用方法')) {
            return `**使い方について**

このチャットボットでは以下のことができます：

• **サービスについて質問**: 「サービスについて教えて」
• **料金について質問**: 「料金について教えて」
• **連絡先を確認**: 「連絡先を教えて」
• **その他の質問**: 自由にメッセージをお送りください

クイックアクションボタンもご活用ください。`;
        }
        
        // 代表者関連の質問
        if (messageLower.includes('代表') || messageLower.includes('社長') || messageLower.includes('責任者')) {
            return `**代表者について**

代表取締役: 田中太郎

経歴:
• システムエンジニアとして10年の経験
• AI技術の導入支援を専門とする
• 多数の企業のDX推進をサポート

詳細な経歴や実績については、お問い合わせください。`;
        }
        
        // デフォルト応答
        return `申し訳ございません。現在サーバーに接続できませんが、以下のようなご質問にお答えできます：

• **サービスについて**: 「サービスについて教えて」
• **料金について**: 「料金について教えて」  
• **連絡先について**: 「連絡先を教えて」
• **使い方について**: 「使い方を教えて」

上記のキーワードを含めて再度お聞かせください。`;
    }

    // 接続テスト
    function testConnection() {
        console.log('🔍 Testing API connection...');
        
        fetch(chatbot.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'test',
                messages: []
            })
        })
        .then(response => {
            console.log('🔍 Connection test response status:', response.status);
            if (response.ok) {
                console.log('✅ API connection successful');
            } else {
                console.warn('⚠️ API connection failed with status:', response.status);
            }
        })
        .catch(error => {
            console.error('❌ Connection test failed:', error);
        });
    }

    // ページ読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }

    // グローバルアクセス用
    window.mobileChatbot = {
        toggle: toggleChatbot,
        send: sendMessage,
        clear: clearMessages
    };

})();
