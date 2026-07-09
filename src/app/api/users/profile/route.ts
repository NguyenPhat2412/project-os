import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { profileConfig } from '@/lib/project-config';
import { getDevProfile, setDevProfile, shouldUseDevProfileStore } from '@/lib/api/profile-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (shouldUseDevProfileStore()) {
    return NextResponse.json({ data: await getDevProfile(session.user.id) });
  }

  return NextResponse.json({ data: await profileConfig.helpers.fetch(session.user.id) });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, address, phone, department, title, timezone, bio, photoURL } = body;
  const profile = {
    displayName: displayName ?? '',
    address: address ?? '',
    email: session.user.email ?? '',
    uid: session.user.id,
    photoURL,
    phone,
    department,
    title,
    timezone,
    bio,
    updatedAt: new Date().toISOString(),
  };

  if (shouldUseDevProfileStore()) {
    await setDevProfile(session.user.id, profile);
    return NextResponse.json({ ok: true });
  }

  await profileConfig.helpers.set(session.user.id, profile);

  return NextResponse.json({ ok: true });
}
