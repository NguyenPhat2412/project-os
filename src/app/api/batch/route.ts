/**
 * Batch write operations API route.
 *
 * POST /api/batch → execute multiple Firestore operations in a single batch
 *
 * Body:
 * {
 *   operations: [
 *     { method: 'set' | 'update' | 'delete', id: string, path: string, data?: Record<string, unknown> }
 *   ]
 * }
 *
 * All operations execute atomically via Firestore batch.
 * Returns results array with success/error per operation.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firestore-admin';
import type { BatchRequest } from '@/lib/api/types';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  let body: BatchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, { status: 400 });
  }

  if (!body.operations?.length) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'No operations' } }, { status: 400 });
  }

  try {
    let hasWrites = false;
    const batch = db.batch();
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const op of body.operations) {
      if (!op.path || !op.id) {
        results.push({ id: op.id ?? '(no-id)', success: false, error: 'Missing path or id' });
        continue;
      }

      const ref = db.doc(`${op.path}/${op.id}`);

      switch (op.method) {
        case 'set':
          batch.set(ref, { ...op.data, updatedAt: new Date() }, { merge: true });
          hasWrites = true;
          break;
        case 'update':
          batch.update(ref, { ...op.data, updatedAt: new Date() });
          hasWrites = true;
          break;
        case 'delete':
          batch.delete(ref);
          hasWrites = true;
          break;
        default:
          results.push({ id: op.id, success: false, error: `Unknown method: ${op.method}` });
          continue;
      }

      results.push({ id: op.id, success: true });
    }

    if (hasWrites) {
      await batch.commit();
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
