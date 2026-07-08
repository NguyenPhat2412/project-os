import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { profileConfig } from '@/lib/project-config';

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, address } = body;

  await profileConfig.helpers.set(session.user.id, {
    displayName: displayName ?? '',
    address: address ?? '',
    email: session.user.email ?? '',
    uid: session.user.id,
    photoURL: undefined,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
