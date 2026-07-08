import { NextResponse } from 'next/server';
import { createUser } from '@/lib/users';

export async function POST() {
  try {
    const user = await createUser({
      email: 'admin@claudecode.ai',
      name: 'Admin User',
      password: '123456789',
    });
    return NextResponse.json({ ok: true, uid: user.id, email: user.email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('already exists')) {
      return NextResponse.json({ ok: false, error: 'User already exists' }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
