/**
 * AI Chatbot Configuration
 * 設定ファイル - OpenAI APIキーやその他の設定
 */

// OpenAI API設定
const AI_CONFIG = {
    // OpenAI APIキー（環境変数または直接設定）
    // 本番環境では環境変数 OPENAI_API_KEY を使用してください
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
    
    // API設定
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.7,
    
    // APIエンドポイント
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    
    // フォールバック設定
    enableFallback: true,
    fallbackDelay: 1000, // フォールバック応答までの遅延（ミリ秒）
    
    // デバッグ設定
    debug: process.env.NODE_ENV === 'development',
    logRequests: false
};

// 企業情報設定
const COMPANY_CONFIG = {
    name: "allgens",
    displayName: "allgens",
    tagline: "AI導入コンサルティング",
    
    services: {
        "ai": {
            name: "AI導入コンサルティング",
            description: "業務プロセスの自動化とAI活用戦略の立案",
            icon: "🤖"
        },
        "system": {
            name: "システム運用サポート", 
            description: "24時間365日の監視と障害対応",
            icon: "⚙️"
        },
        "ec": {
            name: "ECマーケティング支援",
            description: "オンライン販売の最適化とマーケティング戦略",
            icon: "🛒"
        },
        "development": {
            name: "システム開発",
            description: "カスタムシステムの開発と既存システムの改修",
            icon: "💻"
        },
        "other": {
            name: "その他",
            description: "その他のサービスに関するご相談",
            icon: "💡"
        }
    },
    
    contact: {
        phone: "03-1234-5678",
        email: "info@allgens.co.jp",
        address: "〒100-0001 東京都千代田区千代田1-1-1 バーチャルオフィス",
        hours: "平日 9:00-18:00",
        website: "https://allgens.co.jp"
    },
    
    features: [
        "初回相談無料",
        "24時間365日の監視体制",
        "中小企業様もお気軽にご利用可能",
        "導入期間は3ヶ月から6ヶ月程度",
        "経験豊富な専門スタッフがサポート"
    ],
    
    // FAQ情報
    faq: [
        {
            question: "無料相談はありますか？",
            answer: "はい、初回のご相談は無料で承っております。お客様のビジネス課題について、専門スタッフが詳しくお話を伺い、最適なソリューションをご提案いたします。"
        },
        {
            question: "導入までの期間はどのくらいですか？",
            answer: "プロジェクトの規模や内容により異なりますが、一般的には3ヶ月から6ヶ月程度を想定しています。詳細なスケジュールは、お打ち合わせの際にご提案いたします。"
        },
        {
            question: "サポート体制はどうなっていますか？",
            answer: "24時間365日の監視体制で、お客様のシステムをサポートしています。障害発生時も迅速な対応で、業務への影響を最小限に抑えます。"
        },
        {
            question: "中小企業でも利用できますか？",
            answer: "はい、中小企業様にもお気軽にご利用いただけます。お客様の規模に合わせた最適なソリューションをご提案いたします。"
        }
    ]
};

// チャットボット設定
const CHATBOT_CONFIG = {
    // 初期メッセージ
    initialMessage: `こんにちは！AIアシスタントのallgensです 🤖

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

何かお手伝いできることはありますか？`,

    // クイックアクション
    quickActions: [
        { id: "service-help", label: "🤖 サービス選択のヘルプ", icon: "🤖" },
        { id: "draft-message", label: "✍️ メッセージ下書き", icon: "✍️" },
        { id: "pricing-info", label: "💰 料金について", icon: "💰" },
        { id: "contact-info", label: "📞 連絡先情報", icon: "📞" },
        { id: "help", label: "❓ 使い方ガイド", icon: "❓" }
    ],

    // 応答設定
    responseSettings: {
        maxRetries: 3,
        timeout: 10000, // 10秒
        typingDelay: 1000, // タイピング表示時間
        fallbackMessage: "申し訳ございません。現在、AIアシスタントに接続できません。しばらく時間をおいてから再度お試しください。"
    },

    // ローカルストレージ設定
    storage: {
        messagesKey: 'chatbot_messages',
        suggestionsKey: 'chatbot_suggestions',
        maxMessages: 100
    }
};

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AI_CONFIG,
        COMPANY_CONFIG,
        CHATBOT_CONFIG
    };
}

// ブラウザ環境用
if (typeof window !== 'undefined') {
    window.ChatbotConfig = {
        AI_CONFIG,
        COMPANY_CONFIG,
        CHATBOT_CONFIG
    };
}
