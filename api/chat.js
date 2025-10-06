/**
 * Vercel API Route: AI Chat Endpoint
 * OpenAI API integration for chatbot responses
 * 
 * このファイルはVercelのServerless Functionとして動作します。
 * フロントエンドからPOSTリクエストを受け取り、OpenAI APIを呼び出してAI応答を生成します。
 */

// VercelのServerless Function用のエクスポート
export default async function handler(req, res) {
  // エラーハンドリングの追加
  try {
  // デバッグログの開始
  console.log('🚀 Chat API called:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body ? JSON.stringify(req.body).substring(0, 200) + '...' : 'No body'
  });

  // CORS設定：フロントエンドからのリクエストを許可
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    res.status(200).end();
    return;
  }

  // POSTリクエストのみを許可
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    res.status(405).json({ 
      error: 'Method not allowed. Only POST requests are supported.' 
    });
    return;
  }

  try {
    // リクエストボディからメッセージとフォームデータを取得
    const { message, formData, context } = req.body;

    console.log('📝 Request data:', { message, formData, context });

    // メッセージが存在するかチェック
    if (!message || typeof message !== 'string') {
      console.log('❌ Invalid message:', message);
      res.status(400).json({ 
        error: 'Message is required and must be a string.' 
      });
      return;
    }

    // OpenAI APIキーを環境変数から取得
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔑 API Key status:', openaiApiKey ? 'Present' : 'Missing');
    
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key is not configured');
      console.log('🔄 Falling back to mock response...');
      
      // フォールバック：モック応答を返す
      const mockResponse = generateMockResponse(message, formData);
      
      res.status(200).json({
        message: mockResponse,
        timestamp: new Date().toISOString(),
        success: true,
        source: 'mock'
      });
      return;
    }

    console.log('🤖 Generating AI response...');
    
    // AI応答を生成
    const aiResponse = await generateAIResponse(message, formData, openaiApiKey);

    console.log('✅ AI Response generated:', aiResponse.substring(0, 100) + '...');

    // 成功レスポンスを返す
    res.status(200).json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (error) {
    // エラーログを出力
    console.error('💥 Chat API Error:', error);
    console.log('🔄 Attempting fallback to mock response...');

    try {
      // フォールバック：モック応答を試行
      const { message, formData } = req.body;
      const mockResponse = generateMockResponse(message, formData);
      
      res.status(200).json({
        message: mockResponse,
        timestamp: new Date().toISOString(),
        success: true,
        source: 'mock-fallback'
      });
    } catch (fallbackError) {
      console.error('💥 Fallback also failed:', fallbackError);
      
      // 最終的なエラーレスポンス
      res.status(500).json({
        error: 'AI service temporarily unavailable. Please try again later.',
        timestamp: new Date().toISOString(),
        success: false
      });
    }
  }
}

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
        model: 'gpt-4o-mini', // 低コストで高性能なモデル
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
        max_tokens: 500, // 応答の最大トークン数
        temperature: 0.7, // 創造性のレベル（0-1）
        stream: false // ストリーミングは無効
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
    
    // フォールバック応答を返す
    return generateFallbackResponse(message, formData);
  }
}

/**
 * システムプロンプトを構築する関数
 * AIに与える指示とコンテキストを定義
 * @param {object} formData - フォームの入力データ
 * @returns {string} - システムプロンプト
 */
function buildSystemPrompt(formData) {
  return `あなたはallgensという企業のAIアシスタントです。お問い合わせフォームの入力サポートを担当しています。

【企業情報】
- 会社名: allgens
- 連絡先: 03-1234-5678 / info@allgens.co.jp
- 営業時間: 平日 9:00-18:00

【提供サービス】
- AI導入コンサルティング
- システム運用サポート
- ECマーケティング支援
- システム開発

【特徴】
- 初回相談無料
- 24時間365日の監視体制
- 中小企業様もお気軽にご利用可能
- 導入期間は3ヶ月から6ヶ月程度

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
6. 長すぎず、読みやすい形式で回答

【禁止事項】
- 他の企業の情報を提供
- 不正確な情報の提供
- 攻撃的または不適切な表現`;
}

/**
 * サービス名を取得する関数
 * @param {string} serviceKey - サービスのキー
 * @returns {string} - サービス名
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
 * フォールバック応答を生成する関数
 * OpenAI APIが利用できない場合の代替応答
 * @param {string} message - ユーザーのメッセージ
 * @param {object} formData - フォームの入力データ
 * @returns {string} - フォールバック応答
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
    return `📞 **電話番号**: 03-1234-5678
📧 **メール**: info@allgens.co.jp
🕒 **営業時間**: 平日 9:00-18:00
📍 **所在地**: 〒100-0001 東京都千代田区千代田1-1-1 バーチャルオフィス

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
• 電話: 03-1234-5678
• メール: info@allgens.co.jp`;
}

// エラーハンドリングの追加
} catch (error) {
  console.error('💥 Unexpected error in handler:', error);
  return res.status(500).json({
    success: false,
    message: 'サーバー内部エラーが発生しました。しばらく時間をおいてから再度お試しください。',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
}