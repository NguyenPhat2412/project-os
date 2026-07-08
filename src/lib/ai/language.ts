export type AILanguage = 'vi' | 'en' | 'ja' | 'ko';

export const AI_LANGUAGES: { value: AILanguage; label: string }[] = [
  { value: 'vi', label: 'VI' },
  { value: 'en', label: 'EN' },
  { value: 'ja', label: 'JP' },
  { value: 'ko', label: 'KR' },
];

export const LANGUAGE_SYSTEM_MESSAGES: Record<AILanguage, string> = {
  vi: 'Bạn là trợ lý AI chuyên nghiệp. Luôn trả lời bằng Tiếng Việt, trừ khi nội dung kỹ thuật bắt buộc dùng tiếng Anh (tên biến, API, v.v.).',
  en: 'You are a professional AI assistant. Always respond in English.',
  ja: 'あなたはプロのAIアシスタントです。常に日本語で回答してください。技術的な内容（変数名、APIなど）は英語のままで構いません。',
  ko: '당신은 전문 AI 어시스턴트입니다. 항상 한국어로 답변해 주세요. 변수명이나 API 등 기술적인 내용은 영어를 사용해도 됩니다.',
};

/** Appended to every prompt to enforce the output language. */
export const LANGUAGE_PROMPT_SUFFIX: Record<AILanguage, string> = {
  vi: 'IMPORTANT: Write your entire response in Vietnamese (Tiếng Việt).',
  en: 'IMPORTANT: Write your entire response in English.',
  ja: 'IMPORTANT: Write your entire response in Japanese (日本語).',
  ko: 'IMPORTANT: Write your entire response in Korean (한국어).',
};
