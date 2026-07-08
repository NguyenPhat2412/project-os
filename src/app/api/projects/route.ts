/**
 * Root projects collection API.
 *
 * Pattern:
 *   GET    /api/projects           → list all projects
 *   GET    /api/projects/{id}     → get single project
 *   POST   /api/projects           → create project
 *   PUT    /api/projects/{id}      → replace project
 *   PATCH  /api/projects/{id}      → update fields
 *   DELETE /api/projects/{id}      → delete project
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';

const COLLECTION = 'projects';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function projectDoc(id: string) {
  return db.collection(COLLECTION).doc(id);
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl;
  const id = url.searchParams.get('id');
  try {
    if (id) {
      const snap = await projectDoc(id).get();
      if (!snap.exists) return NextResponse.json({ data: null });
      return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
    }
    const snap = await db.collection(COLLECTION).get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id: _id, ...data } = body;
  const docRef = db.collection(COLLECTION).doc();
  try {
    await docRef.set({ ...data, createdAt: new Date(), updatedAt: new Date() });
    const snap = await docRef.get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl;
  const segments = url.pathname.replace('/api/projects/', '').split('/').filter(Boolean);
  const id = segments[0];
  if (!id) {
    return NextResponse.json({ error: 'Project ID is required for PUT' }, { status: 400 });
  }

  const body = await req.json();
  try {
    await projectDoc(id).set({ ...body, updatedAt: new Date() });
    const snap = await projectDoc(id).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl;
  const segments = url.pathname.replace('/api/projects/', '').split('/').filter(Boolean);
  const id = segments[0];
  if (!id) {
    return NextResponse.json({ error: 'Project ID is required for PATCH' }, { status: 400 });
  }

  const body = await req.json();
  try {
    await projectDoc(id).update({ ...body, updatedAt: new Date() });
    const snap = await projectDoc(id).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl;
  const segments = url.pathname.replace('/api/projects/', '').split('/').filter(Boolean);
  const id = segments[0];
  if (!id) {
    return NextResponse.json({ error: 'Project ID is required for DELETE' }, { status: 400 });
  }

  try {
    await projectDoc(id).delete();
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
