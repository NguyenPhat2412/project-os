import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  return NextResponse.json(await auth());
}

export async function POST() {
  return NextResponse.json(
    { error: { code: 'AUTH_MOVED', message: 'Authentication is served by /api/v1/auth.' } },
    { status: 410 },
  );
}
