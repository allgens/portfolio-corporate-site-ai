/**
 * Vercel API Route: AI Chat Endpoint with RAG
 * OpenAI API integration for chatbot responses with Retrieval-Augmented Generation
 * 
 * このファイルはVercelのServerless Functionとして動作します。
 * フロントエンドからPOSTリクエストを受け取り、RAG技術を使ってサイト内容に基づいたAI応答を生成します。
 */

// RAGユーティリティをインポート
const { createKnowledgeBase, searchRelevantInfo, formatContext, generateRAGPrompt } = require('./rag-utils');

// VercelのServerless Function用のエクスポート
module.exports = async function handler(req, res) {
  try {
    // CORS設定：フロントエンドからのリクエストを許可
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // POSTリクエストのみを許可
    if (req.method !== 'POST') {
      res.status(405).json({ 
        error: 'Method not allowed. Only POST requests are supported.' 
      });
      return;
    }

    // リクエストボディからメッセージとフォームデータを取得
    const { message, formData } = req.body;

    // メッセージが存在するかチェック
    if (!message || typeof message !== 'string') {
      res.status(400).json({ 
        error: 'Message is required and must be a string.' 
      });
      return;
    }

    // OpenAI APIキーを環境変数から取得
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.log('🔄 OpenAI API key not configured, using RAG mock response...');
      
      // フォールバック：RAG対応のモック応答を返す
      const knowledgeBase = createKnowledgeBase();
      const relevantInfo = searchRelevantInfo(message, knowledgeBase, 3);
      const context = formatContext(relevantInfo);
      const mockResponse = generateRAGMockResponse(message, context, formData);
      
      res.status(200).json({
        message: mockResponse,
        timestamp: new Date().toISOString(),
        success: true,
        source: 'rag-mock'
      });
      return;
    }

    // AI応答を生成（RAG対応）
    const knowledgeBase = createKnowledgeBase();
    const relevantInfo = searchRelevantInfo(message, knowledgeBase, 3);
    const context = formatContext(relevantInfo);
    const ragPrompt = generateRAGPrompt(message, context, formData);
    
    const aiResponse = await generateAIResponse(ragPrompt, formData, openaiApiKey);

    // 成功レスポンスを返す
    res.status(200).json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (error) {
    console.error('💥 Chat API Error:', error);
    
    // フォールバック：RAG対応のモック応答を試行
    try {
      const { message, formData } = req.body;
      
      const knowledgeBase = createKnowledgeBase();
      const relevantInfo = searchRelevantInfo(message, knowledgeBase, 2);
      const context = formatContext(relevantInfo);
      const mockResponse = generateRAGMockResponse(message, context, formData);
      
      res.status(200).json({
        message: mockResponse,
        timestamp: new Date().toISOString(),
        success: true,
        source: 'rag-mock-fallback'
      });
    } catch (fallbackError) {
      console.error('💥 Fallback also failed:', fallbackError);
      
      res.status(500).json({
        error: 'AI service temporarily unavailable. Please try again later.',
        timestamp: new Date().toISOString(),
        success: false
      });
    }
  }
};

/**
 * OpenAI APIを使用してAI応答を生成する関数
 * @param {string} message - ユーザーのメッセージ
 * @param {object} formData - フォームの入力データ
 * @param {string} apiKey - OpenAI APIキー
 * @returns {Promise<string>} - AI応答メッセージ
 */
async function generateAIResponse(message, formData = {}, apiKey) {
  try {
    // システムプロンプトを構築
    const systemPrompt = buildSystemPrompt(formData);
    
    // OpenAI APIへのリクエストを送信
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

    // レスポンスのステータスをチェック
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    // レスポンスデータを取得
    const data = await response.json();
    
    // AI応答を抽出
    const aiMessage = data.choices?.[0]?.message?.content;
    
    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    return aiMessage;

  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

/**
 * システムプロンプトの構築
 * @param {object} formData - フォームの入力データ
 * @returns {string} - システムプロンプト
 */
function buildSystemPrompt(formData) {
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
- サービス: ${getServiceName(formData.service) || '未選択'}
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
function getServiceName(serviceKey) {
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
 * RAG対応のモック応答を生成
 */
function generateRAGMockResponse(message, context, formData) {
  const lowerMessage = message.toLowerCase();

  // 挨拶
  if (anyWord(lowerMessage, ['こんにちは', 'hello', 'はじめまして', 'おはよう', 'こんばんは'])) {
    return "こんにちは！AIアシスタントです。お問い合わせフォームの入力をお手伝いさせていただきます。どのようなご相談でしょうか？";
  }

  // 連絡先情報
  if (anyWord(lowerMessage, ['連絡先', '電話', 'メール', '住所', 'アクセス', '会社情報'])) {
    return `連絡先情報をご案内いたします。

📞 **電話番号**: 03-1234-5678
📧 **メールアドレス**: contact@example.com
📍 **所在地**: 〒100-0001 東京都千代田区千代田1-1-1 バーチャルオフィス
🕒 **営業時間**: 平日 9:00-18:00

お気軽にお問い合わせください！`;
  }

  // サービス関連
  if (anyWord(lowerMessage, ['サービス', 'service', '料金', '価格', 'プラン'])) {
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

  // コンテキストがある場合はそれを活用
  if (context && context !== "関連する情報が見つかりませんでした。") {
    return `お問い合わせいただき、ありがとうございます！

${context}

上記の情報を参考に、お客様のご質問にお答えいたします。

**重要事項：**
• 上記の情報は当社の公式情報に基づいてお答えしています
• ホームページに記載されていない情報については、お答えできません
• より詳細な情報が必要な場合は、直接お問い合わせください

ご不明な点や追加でお聞きになりたいことがございましたら、お気軽にお尋ねください。初回相談は無料で承っております。

📞 **お問い合わせ先：**
• 電話: 03-1234-5678
• メール: contact@example.com`;
  }

  // デフォルト応答
  return `ありがとうございます！お問い合わせ内容を確認いたします。

お客様のご要望に合わせて、最適なソリューションをご提案いたします。

💡 **お手伝いできること：**
• サービス選択のアドバイス
• メッセージの下書き作成
• 料金・連絡先情報の案内
• フォーム入力のサポート

具体的なご質問やご不明な点がございましたら、お気軽にお尋ねください。初回相談は無料で承っております。`;
}

/**
 * 文字列に指定された単語が含まれているかチェック
 */
function anyWord(text, words) {
  return words.some(word => text.includes(word));
}