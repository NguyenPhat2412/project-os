import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, verifyPassword } from '@/lib/users';
import { db } from '@/lib/firestore-admin';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  try {
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await verifyPassword(user, password);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
    }

    // Delete user document from Firestore users collection
    await db.collection('users').doc(session.user.id).delete();

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
