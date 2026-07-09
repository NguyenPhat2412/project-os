import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createUser } from '@/lib/users';

const registerSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(6),
  name: z.string().trim().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid registration data' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const name = parsed.data.name ?? email.split('@')[0];

  try {
    const user = await createUser({ email, password, name });
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create account';

    if (message.includes('already exists')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
