import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { LANGUAGE_SYSTEM_MESSAGES, type AILanguage } from '@/lib/ai/language';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY chưa được cấu hình' }, { status: 500 });
  }

  const { prompt, language } = (await req.json()) as { prompt: string; language?: AILanguage };
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  const systemMessage = LANGUAGE_SYSTEM_MESSAGES[language ?? 'vi'];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemMessage,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    return NextResponse.json({ error: err?.error?.message ?? `Claude API lỗi: ${response.status}` }, { status: response.status });
  }

  const data = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data?.content?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: 'Không nhận được phản hồi từ Claude' }, { status: 500 });
  }

  return NextResponse.json({ text });
}
