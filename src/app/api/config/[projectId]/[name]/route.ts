/**
 * Config document API route.
 *
 * GET  /api/config/{projectId}/{name} → read a config document
 * PUT  /api/config/{projectId}/{name} → update a config document
 *
 * Handles:
 *   - projects/{projectId}/config/{name}   → general config documents
 *   - projects/{projectId}/user_profiles/{uid} → user profile (any name maps here)
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';
import { checkPermission, pathToResource, permissionDenied } from '@/lib/api/permissions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; name: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { projectId, name } = await params;
  const url = new URL(req.url);
  const docId = url.searchParams.get('docId');

  try {
    let docRef: FirebaseFirestore.DocumentReference;

    if (docId) {
      // Dynamic doc ID: read from projects/{projectId}/config/{name}/{docId} or user_profiles/{docId}
      if (name === 'user_profiles' || name === 'profile') {
        docRef = db.collection('projects').doc(projectId).collection('user_profiles').doc(docId);
      } else {
        docRef = db.collection('projects').doc(projectId).collection('config').doc(docId);
      }
    } else if (name === 'user_profiles' || name === 'profile') {
      // Default: read own user profile
      docRef = db.collection('projects').doc(projectId).collection('user_profiles').doc(session.user.id);
    } else {
      // Default: read the named config document
      const resource = pathToResource(name);
      if (!resource) {
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: `Unknown config name: ${name}` } }, { status: 400 });
      }
      const allowed = await checkPermission({ uid: session.user.id, email: session.user.email, projectId, action: 'read', resource });
      if (!allowed) return permissionDenied();
      docRef = db.collection('projects').doc(projectId).collection('config').doc(name);
    }

    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ data: null });
    }
    const data = snap.data();
    return NextResponse.json({ data: { id: snap.id, ...data } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string; name: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const { projectId, name } = await params;
  const url = new URL(req.url);
  const docId = url.searchParams.get('docId');

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, { status: 400 });
  }

  try {
    let docRef: FirebaseFirestore.DocumentReference;

    if (docId) {
      // Dynamic doc ID: write to projects/{projectId}/config/{name}/{docId} or user_profiles/{docId}
      if (name === 'user_profiles' || name === 'profile') {
        docRef = db.collection('projects').doc(projectId).collection('user_profiles').doc(docId);
      } else {
        docRef = db.collection('projects').doc(projectId).collection('config').doc(docId);
      }
    } else if (name === 'user_profiles' || name === 'profile') {
      // Default: write own user profile
      docRef = db.collection('projects').doc(projectId).collection('user_profiles').doc(session.user.id);
    } else {
      // Default: write the named config document
      const resource = pathToResource(name);
      if (!resource) {
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: `Unknown config name: ${name}` } }, { status: 400 });
      }
      const allowed = await checkPermission({ uid: session.user.id, email: session.user.email, projectId, action: 'write', resource });
      if (!allowed) return permissionDenied();
      docRef = db.collection('projects').doc(projectId).collection('config').doc(name);
    }

    await docRef.set({ ...body, updatedAt: new Date() }, { merge: true });
    const snap = await docRef.get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
