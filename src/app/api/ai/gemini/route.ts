import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { LANGUAGE_SYSTEM_MESSAGES, type AILanguage } from '@/lib/ai/language';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY chưa được cấu hình' }, { status: 500 });
  }

  const { prompt, language } = (await req.json()) as { prompt: string; language?: AILanguage };
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  const systemMessage = LANGUAGE_SYSTEM_MESSAGES[language ?? 'vi'];

  const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemMessage }] },
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    const msg = data?.error?.message ?? `Gemini API lỗi: ${response.status}`;
    return NextResponse.json({ error: msg }, { status: response.status });
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: 'Không nhận được phản hồi từ Gemini' }, { status: 500 });
  }

  return NextResponse.json({ text });
}
