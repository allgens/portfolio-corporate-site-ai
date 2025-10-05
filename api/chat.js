/**
 * AI Chat API Endpoint for GitHub Pages
 * OpenAI API integration for chatbot responses
 */

// OpenAI API設定
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// サービス情報（コンテキストとして使用）
const COMPANY_CONTEXT = {
    name: "allgens",
    services: {
        "ai": "AI導入コンサルティング",
        "system": "システム運用サポート", 
        "ec": "ECマーケティング支援",
        "development": "システム開発",
        "other": "その他"
    },
    contact: {
        phone: "03-1234-5678",
        email: "info@allgens.co.jp",
        address: "〒100-0001 東京都千代田区千代田1-1-1 バーチャルオフィス",
        hours: "平日 9:00-18:00"
    },
    features: [
        "初回相談無料",
        "24時間365日の監視体制",
        "中小企業様もお気軽にご利用可能",
        "導入期間は3ヶ月から6ヶ月程度"
    ]
};

/**
 * AI応答生成関数
 */
async function generateAIResponse(message, formData = {}) {
    try {
        // システムプロンプトの構築
        const systemPrompt = buildSystemPrompt(formData);
        
        // OpenAI APIリクエスト
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('AI Response Generation Error:', error);
        // フォールバック応答
        return generateFallbackResponse(message, formData);
    }
}

/**
 * システムプロンプトの構築
 */
function buildSystemPrompt(formData) {
    return `あなたはallgensという企業のAIアシスタントです。お問い合わせフォームの入力サポートを担当しています。

【企業情報】
- 会社名: ${COMPANY_CONTEXT.name}
- 連絡先: ${COMPANY_CONTEXT.contact.phone} / ${COMPANY_CONTEXT.contact.email}
- 営業時間: ${COMPANY_CONTEXT.contact.hours}

【提供サービス】
${Object.entries(COMPANY_CONTEXT.services).map(([key, value]) => `- ${value}`).join('\n')}

【特徴】
${COMPANY_CONTEXT.features.map(feature => `- ${feature}`).join('\n')}

【現在のフォーム入力状況】
- お名前: ${formData.name || '未入力'}
- 会社名: ${formData.company || '未入力'}
- メールアドレス: ${formData.email || '未入力'}
- 電話番号: ${formData.phone || '未入力'}
- サービス: ${COMPANY_CONTEXT.services[formData.service] || '未選択'}
- お問い合わせ内容: ${formData.message || '未入力'}

【応答方針】
1. 親切で丁寧な日本語で応答
2. 絵文字を適度に使用して親しみやすく
3. フォーム入力の進捗に応じて適切なアドバイス
4. サービス選択や料金に関する質問には具体的に回答
5. メッセージ下書きの作成をサポート
6. 長すぎず、読みやすい形式で回答

【禁止事項】
- 他の企業の情報を提供
- 不正確な情報の提供
- 攻撃的または不適切な表現`;
}

/**
 * フォールバック応答の生成
 */
function generateFallbackResponse(message, formData) {
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
        return `📞 **電話番号**: ${COMPANY_CONTEXT.contact.phone}
📧 **メール**: ${COMPANY_CONTEXT.contact.email}
🕒 **営業時間**: ${COMPANY_CONTEXT.contact.hours}
📍 **所在地**: ${COMPANY_CONTEXT.contact.address}

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
    
    // デフォルト応答
    return `ありがとうございます！お問い合わせ内容を確認いたします。

お客様のご要望に合わせて、最適なソリューションをご提案いたします。

💡 **お手伝いできること：**
• サービス選択のアドバイス
• メッセージの下書き作成
• 料金・連絡先情報の案内
• フォーム入力のサポート

具体的なご質問やご不明な点がございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **直接のお問い合わせも可能です：**
• 電話: ${COMPANY_CONTEXT.contact.phone}
• メール: ${COMPANY_CONTEXT.contact.email}`;
}

/**
 * メッセージ下書きの生成
 */
function generateMessageDraft(formData) {
    let draft = `お世話になっております。`;
    
    if (formData.company) {
        draft += `\n${formData.company}の${formData.name}と申します。`;
    } else if (formData.name) {
        draft += `\n${formData.name}と申します。`;
    }

    draft += `\n\nこの度は、貴社のサービスについてお問い合わせさせていただきたく、`;
    draft += `\nご連絡いたしました。`;

    if (formData.service) {
        const serviceName = COMPANY_CONTEXT.services[formData.service];
        if (serviceName) {
            draft += `\n\n特に${serviceName}について`;
            draft += `\nご相談がございます。`;
        }
    }

    draft += `\n\n詳細につきましては、お時間のある際に`;
    draft += `\nご連絡いただけますと幸いです。`;
    draft += `\n\n何卒よろしくお願いいたします。`;

    return draft;
}

/**
 * エクスポート（Node.js環境用）
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateAIResponse,
        generateFallbackResponse,
        generateMessageDraft,
        COMPANY_CONTEXT
    };
}

/**
 * ブラウザ環境用のグローバル関数
 */
if (typeof window !== 'undefined') {
    window.ChatbotAI = {
        generateAIResponse,
        generateFallbackResponse,
        generateMessageDraft,
        COMPANY_CONTEXT
    };
}
