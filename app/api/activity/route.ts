import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Activity API] Fetching activities...');
    const activities = await db.activities.getAll();
    console.log('[Activity API] Found activities:', activities.length);
    
    if (activities.length > 0) {
      console.log('[Activity API] Sample activity:', JSON.stringify(activities[0], null, 2));
    }
    
    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('[Activity API] Error fetching activities:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch activities',
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
