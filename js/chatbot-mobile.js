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
        savedScrollY: 0
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
                        <button class="chatbot-size-toggle" id="chatbot-size-toggle" title="サイズ変更">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="chatbot-control-btn" id="chatbot-restart" title="会話をリセット">
                            <i class="fas fa-redo"></i>
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
            console.log('✅ Chatbot opened');
        } else {
            container.style.display = 'none';
            floatingBtn.style.display = 'flex';
            console.log('✅ Chatbot closed');
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
        .then(response => response.json())
        .then(data => {
            console.log('📨 API Response:', data);
            hideTypingIndicator();
            
            if (data.response) {
                addMessage('assistant', data.response);
            } else {
                addMessage('assistant', '申し訳ございません。現在サーバーに接続できません。');
            }
        })
        .catch(error => {
            console.error('❌ API Error:', error);
            hideTypingIndicator();
            addMessage('assistant', 'エラーが発生しました。しばらくしてから再度お試しください。');
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

    // サイズ切り替え
    function toggleSize() {
        console.log('📏 Toggling size...');
        const container = document.getElementById('chatbot-container');
        
        if (chatbot.currentSize === 'large') {
            container.className = 'chatbot-container compact';
            chatbot.currentSize = 'compact';
            console.log('✅ Size changed to compact');
        } else {
            container.className = 'chatbot-container large';
            chatbot.currentSize = 'large';
            console.log('✅ Size changed to large');
        }
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
