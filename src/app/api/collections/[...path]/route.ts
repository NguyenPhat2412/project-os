/**
 * Dynamic collection CRUD route for project-scoped Firestore collections.
 *
 * Pattern:
 *   GET    /api/collections/{projectId}/{collection}          → list documents
 *   GET    /api/collections/{projectId}/{collection}/{id}     → get single document
 *   POST   /api/collections/{projectId}/{collection}          → create document
 *   PUT    /api/collections/{projectId}/{collection}/{id}      → replace document
 *   PATCH  /api/collections/{projectId}/{collection}/{id}      → update fields
 *   DELETE /api/collections/{projectId}/{collection}/{id}     → delete document
 *
 * Query params for list (GET without doc ID):
 *   where       → JSON array of [field, op, value] triples, e.g. [["status","==","open"]]
 *   orderBy     → field name, optionally ":asc" or ":desc" suffix
 *   limit       → max documents to return (number)
 *   startAfter  → cursor value to start after (string)
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkPermission, pathToResource, permissionDenied } from '@/lib/api/permissions';
import { db } from '@/lib/firestore-admin';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract projectId, collectionName, and docId from a splat path.
 * Handles both:
 *   - /api/collections/{projectId}/{collection}[/{id}]    (old style)
 *   - /api/collections/projects/{projectId}/{collection}   (new style with "projects" prefix)
 */
function parsePath(pathParts: string[]) {
  if (pathParts.length < 2) return null;

  let projectId: string;
  let collectionName: string;
  let docId: string | undefined;

  if (pathParts[0] === 'projects' && pathParts.length >= 3) {
    // New style: /api/collections/projects/{projectId}/{collection}[/{id}]
    projectId = pathParts[1];
    collectionName = pathParts[2];
    docId = pathParts.length > 3 ? pathParts.slice(3).join('/') : undefined;
  } else {
    // Old style: /api/collections/{projectId}/{collection}[/{id}]
    projectId = pathParts[0];
    collectionName = pathParts[1];
    docId = pathParts.length > 2 ? pathParts.slice(2).join('/') : undefined;
  }

  return { projectId, collectionName, docId };
}

/** Parse `where` query param into Firestore where clause array. */
function parseWhere(where: string | string[][] | null | undefined) {
  if (!where) return [];
  try {
    const parsed = typeof where === 'string' ? JSON.parse(where) : where;
    if (!Array.isArray(parsed)) return [];
    if (Array.isArray(parsed[0])) {
      return parsed as [string, FirebaseFirestore.WhereFilterOp, unknown][];
    }
    return [parsed as [string, FirebaseFirestore.WhereFilterOp, unknown]];
  } catch {
    return [];
  }
}

/** Parse `orderBy` query param into [field, direction] pair. */
function parseOrderBy(orderBy: string | null | undefined): [string, 'asc' | 'desc'] | null {
  if (!orderBy) return null;
  if (orderBy.endsWith(':desc')) return [orderBy.slice(0, -5), 'desc'];
  if (orderBy.endsWith(':asc')) return [orderBy.slice(0, -4), 'asc'];
  return [orderBy, 'asc'];
}

/** Build a Firestore query from parsed list params. */
function buildQuery(
  ref: FirebaseFirestore.CollectionReference,
  where: [string, FirebaseFirestore.WhereFilterOp, unknown][],
  orderBy: [string, 'asc' | 'desc'] | null,
  limit: number | null,
): FirebaseFirestore.Query {
  let query: FirebaseFirestore.Query = ref;
  for (const [field, op, value] of where) {
    query = query.where(field, op, value);
  }
  if (orderBy) {
    query = query.orderBy(orderBy[0], orderBy[1]);
  }
  if (limit !== null) {
    query = query.limit(limit);
  }
  return query;
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const uid = session.user.id;

  const pathParts = req.nextUrl.pathname.replace('/api/collections/', '').split('/');
  const parsed = parsePath(pathParts);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  const { projectId, collectionName, docId } = parsed;

  const resource = pathToResource(collectionName);
  if (!resource) {
    return NextResponse.json({ error: `Unknown collection: ${collectionName}` }, { status: 400 });
  }

  try {
    const allowed = await checkPermission({ uid, email: session.user.email, projectId, action: 'read', resource });
    if (!allowed) return permissionDenied();

    const { searchParams } = req.nextUrl;
    if (docId) {
      const snap = await db.collection('projects').doc(projectId).collection(collectionName).doc(docId).get();
      if (!snap.exists) return NextResponse.json({ data: null });
      return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
    }

    const where = parseWhere(searchParams.get('where'));
    const orderBy = parseOrderBy(searchParams.get('orderBy'));
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : null;
    const startAfterVal = searchParams.get('startAfter');
    const colRef = db.collection('projects').doc(projectId).collection(collectionName);
    let query = buildQuery(colRef, where, orderBy, limit);

    if (startAfterVal) {
      const cursorSnap = await colRef.doc(startAfterVal).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap) as FirebaseFirestore.Query;
      }
    }

    const snap = await query.get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const uid = session.user.id;

  const pathParts = req.nextUrl.pathname.replace('/api/collections/', '').split('/');
  const parsed = parsePath(pathParts);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  const { projectId, collectionName } = parsed;

  const resource = pathToResource(collectionName);
  if (!resource) {
    return NextResponse.json({ error: `Unknown collection: ${collectionName}` }, { status: 400 });
  }
  const allowed = await checkPermission({ uid, email: session.user.email, projectId, action: 'write', resource });
  if (!allowed) return permissionDenied();

  const body = await req.json();
  const { __collection: _col, ...data } = body;
  const docRef = db.collection('projects').doc(projectId).collection(collectionName).doc();
  try {
    await docRef.set({ ...data, createdAt: new Date(), updatedAt: new Date() });
    const snap = await docRef.get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const uid = session.user.id;

  const pathParts = req.nextUrl.pathname.replace('/api/collections/', '').split('/');
  const parsed = parsePath(pathParts);
  if (!parsed || !parsed.docId) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  const { projectId, collectionName, docId } = parsed;

  const resource = pathToResource(collectionName);
  if (!resource) {
    return NextResponse.json({ error: `Unknown collection: ${collectionName}` }, { status: 400 });
  }
  const allowed = await checkPermission({ uid, email: session.user.email, projectId, action: 'write', resource });
  if (!allowed) return permissionDenied();

  const body = await req.json();
  const docRef = db.collection('projects').doc(projectId).collection(collectionName).doc(docId);
  try {
    await docRef.set({ ...body, updatedAt: new Date() });
    const snap = await docRef.get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const uid = session.user.id;

  const pathParts = req.nextUrl.pathname.replace('/api/collections/', '').split('/');
  const parsed = parsePath(pathParts);
  if (!parsed || !parsed.docId) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  const { projectId, collectionName, docId } = parsed;

  const resource = pathToResource(collectionName);
  if (!resource) {
    return NextResponse.json({ error: `Unknown collection: ${collectionName}` }, { status: 400 });
  }
  const allowed = await checkPermission({ uid, email: session.user.email, projectId, action: 'write', resource });
  if (!allowed) return permissionDenied();

  const body = await req.json();
  const docRef = db.collection('projects').doc(projectId).collection(collectionName).doc(docId);
  try {
    await docRef.update({ ...body, updatedAt: new Date() });
    const snap = await docRef.get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const uid = session.user.id;

  const pathParts = req.nextUrl.pathname.replace('/api/collections/', '').split('/');
  const parsed = parsePath(pathParts);
  if (!parsed || !parsed.docId) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  const { projectId, collectionName, docId } = parsed;

  const resource = pathToResource(collectionName);
  if (!resource) {
    return NextResponse.json({ error: `Unknown collection: ${collectionName}` }, { status: 400 });
  }
  const allowed = await checkPermission({ uid, email: session.user.email, projectId, action: 'delete', resource });
  if (!allowed) return permissionDenied();

  try {
    await db.collection('projects').doc(projectId).collection(collectionName).doc(docId).delete();
    return NextResponse.json({ data: { id: docId } });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
