/**
 * RAG (Retrieval-Augmented Generation) ユーティリティ
 * 会社情報をベクトル化し、類似度検索を行う
 */

const companyData = require('../data/companyInfo.json');

/**
 * テキストをベクトル化する（簡易版）
 * 実際のプロダクションではOpenAI Embeddings APIを使用
 */
function textToVector(text) {
    // 簡易的なベクトル化（単語の出現頻度ベース）
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return wordCount;
}

/**
 * コサイン類似度を計算
 */
function cosineSimilarity(vecA, vecB) {
    const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (const key of keys) {
        const a = vecA[key] || 0;
        const b = vecB[key] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 会社情報をチャンクに分割してベクトル化
 */
function createKnowledgeBase() {
    const knowledgeBase = [];
    
    // 会社基本情報
    knowledgeBase.push({
        id: 'company-basic',
        content: `${companyData.company.name}（${companyData.company.japaneseName}）は${companyData.company.description}。${companyData.company.founded}年に設立され、${companyData.company.location}に本社を構えています。`,
        category: 'company',
        vector: textToVector(`${companyData.company.name} ${companyData.company.japaneseName} ${companyData.company.description}`)
    });
    
    // 代表者情報
    knowledgeBase.push({
        id: 'representative',
        content: `代表取締役CEOの${companyData.representative.name}です。${companyData.representative.message} ${companyData.representative.background}`,
        category: 'representative',
        vector: textToVector(`${companyData.representative.name} ${companyData.representative.message} ${companyData.representative.background}`)
    });
    
    // サービス情報
    companyData.services.forEach(service => {
        knowledgeBase.push({
            id: `service-${service.id}`,
            content: `${service.name}: ${service.description} 対象: ${service.target} 料金: ${service.price}`,
            category: 'service',
            vector: textToVector(`${service.name} ${service.description} ${service.target} ${service.price}`)
        });
        
        // サービス詳細
        service.features.forEach((feature, index) => {
            knowledgeBase.push({
                id: `service-${service.id}-feature-${index}`,
                content: `${service.name}の機能: ${feature}`,
                category: 'service-feature',
                vector: textToVector(`${service.name} ${feature}`)
            });
        });
    });
    
    // 会社の価値観
    companyData.companyValues.forEach((value, index) => {
        knowledgeBase.push({
            id: `value-${index}`,
            content: `${value.title}: ${value.description}`,
            category: 'values',
            vector: textToVector(`${value.title} ${value.description}`)
        });
    });
    
    // FAQ
    companyData.faq.forEach((faq, index) => {
        knowledgeBase.push({
            id: `faq-${index}`,
            content: `Q: ${faq.question} A: ${faq.answer}`,
            category: 'faq',
            vector: textToVector(`${faq.question} ${faq.answer}`)
        });
    });
    
    // 事例紹介
    companyData.caseStudies.forEach((caseStudy, index) => {
        knowledgeBase.push({
            id: `case-${index}`,
            content: `${caseStudy.title}: ${caseStudy.description} 業界: ${caseStudy.industry} 成果: ${caseStudy.results.join(', ')}`,
            category: 'case-study',
            vector: textToVector(`${caseStudy.title} ${caseStudy.description} ${caseStudy.industry} ${caseStudy.results.join(' ')}`)
        });
    });
    
    // 連絡先情報
    knowledgeBase.push({
        id: 'contact',
        content: `連絡先: ${companyData.contact.office} 営業時間: ${companyData.contact.businessHours} 初回相談: ${companyData.contact.consultation} 回答時間: ${companyData.contact.responseTime}`,
        category: 'contact',
        vector: textToVector(`${companyData.contact.office} ${companyData.contact.businessHours} ${companyData.contact.consultation}`)
    });
    
    return knowledgeBase;
}

/**
 * 関連する情報を検索
 */
function searchRelevantInfo(query, knowledgeBase, topK = 3) {
    const queryVector = textToVector(query);
    
    const similarities = knowledgeBase.map(item => ({
        ...item,
        similarity: cosineSimilarity(queryVector, item.vector)
    }));
    
    // 類似度でソートして上位K件を返す
    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter(item => item.similarity > 0.1); // 閾値以下は除外
}

/**
 * 検索結果をコンテキストとして整形
 */
function formatContext(relevantInfo) {
    if (relevantInfo.length === 0) {
        return "関連する情報が見つかりませんでした。";
    }
    
    let context = "【関連情報】\n";
    relevantInfo.forEach((item, index) => {
        context += `${index + 1}. ${item.content}\n`;
    });
    
    return context;
}

/**
 * RAG用のプロンプトを生成
 */
function generateRAGPrompt(userMessage, context, formData = {}) {
    const formContext = formData.name ? `\n\n【お客様情報】\nお名前: ${formData.name}\n会社名: ${formData.company || '未入力'}\nメール: ${formData.email || '未入力'}\n電話: ${formData.phone || '未入力'}\n選択サービス: ${formData.service || '未選択'}\nメッセージ: ${formData.message || '未入力'}` : '';
    
    return `あなたはAIアシスタントです。以下の情報を参考にして、お客様の質問に丁寧で正確な回答をしてください。

${context}

【指示】
- 上記の情報を基に、お客様の質問に回答してください
- 情報が不足している場合は、適切な質問をして詳細を確認してください
- 営業的な内容ではなく、お客様の役に立つ情報を提供してください
- 日本語で回答してください
- 親しみやすく、プロフェッショナルな口調で回答してください

${formContext}

【お客様の質問】
${userMessage}`;
}

module.exports = {
    createKnowledgeBase,
    searchRelevantInfo,
    formatContext,
    generateRAGPrompt,
    companyData
};
