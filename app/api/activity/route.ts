import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const activities = await db.activities.getAll();
  return NextResponse.json(activities);
}
