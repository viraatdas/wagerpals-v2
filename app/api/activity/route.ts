import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const activities = db.activities.getAll();
  return NextResponse.json(activities);
}

