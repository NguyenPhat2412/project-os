import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkPermission, type Action } from '@/lib/api/permissions';
import { deleteDevProject, getDevProject, setDevProject, shouldUseDevProjectStore, updateDevProject } from '@/lib/api/projects-store';
import { db } from '@/lib/firestore-admin';

const COLLECTION = 'projects';

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

function projectDoc(id: string) {
  return db.collection(COLLECTION).doc(id);
}

async function getProjectId(context: ProjectRouteContext) {
  const { id } = await context.params;
  return id;
}

async function requireProjectAdmin(action: Action = 'write') {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = await checkPermission({
    uid: session.user.id,
    email: session.user.email,
    action,
    resource: 'projects',
  });

  if (!allowed) {
    return NextResponse.json(
      { error: { code: 'PERMISSION_DENIED', message: 'Root admin access is required to manage projects.' } },
      { status: 403 },
    );
  }

  return null;
}

export async function GET(_req: NextRequest, context: ProjectRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = await getProjectId(context);
  try {
    if (shouldUseDevProjectStore()) {
      return NextResponse.json({ data: await getDevProject(id) });
    }

    const snap = await projectDoc(id).get();
    if (!snap.exists) return NextResponse.json({ data: null });
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: ProjectRouteContext) {
  const denied = await requireProjectAdmin('write');
  if (denied) return denied;

  const id = await getProjectId(context);
  const body = await req.json();
  try {
    if (shouldUseDevProjectStore()) {
      const project = await setDevProject(id, body);
      return NextResponse.json({ data: project });
    }

    await projectDoc(id).set({ ...body, updatedAt: new Date() });
    const snap = await projectDoc(id).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: ProjectRouteContext) {
  const denied = await requireProjectAdmin('write');
  if (denied) return denied;

  const id = await getProjectId(context);
  const body = await req.json();
  try {
    if (shouldUseDevProjectStore()) {
      const project = await updateDevProject(id, body);
      return NextResponse.json({ data: project });
    }

    await projectDoc(id).update({ ...body, updatedAt: new Date() });
    const snap = await projectDoc(id).get();
    return NextResponse.json({ data: { id: snap.id, ...snap.data() } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: ProjectRouteContext) {
  const denied = await requireProjectAdmin('delete');
  if (denied) return denied;

  const id = await getProjectId(context);
  try {
    if (shouldUseDevProjectStore()) {
      await deleteDevProject(id);
      return NextResponse.json({ data: { id } });
    }

    await projectDoc(id).delete();
    return NextResponse.json({ data: { id } });
  } catch {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
