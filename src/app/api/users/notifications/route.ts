import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow reading own notifications
  const uid = session.user.id;

  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      return NextResponse.json({});
    }
    const data = doc.data();
    return NextResponse.json(data?.notifications ?? {});
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  await db.collection('users').doc(session.user.id).set(
    { notifications: body, updatedAt: new Date() },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
