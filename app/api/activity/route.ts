import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Activity API] Fetching activities...');
    
    // First check if table exists and has data
    const { sql } = await import('@vercel/postgres');
    const countResult = await sql`SELECT COUNT(*) as count FROM activities`;
    console.log('[Activity API] Raw count from database:', countResult.rows[0]?.count);
    
    const activities = await db.activities.getAll();
    console.log('[Activity API] Found activities after getAll():', activities.length);
    
    if (activities.length > 0) {
      console.log('[Activity API] Sample activity:', JSON.stringify(activities[0], null, 2));
    } else {
      console.log('[Activity API] No activities returned but count was:', countResult.rows[0]?.count);
      // Try raw query
      const rawActivities = await sql`SELECT * FROM activities ORDER BY timestamp DESC LIMIT 5`;
      console.log('[Activity API] Raw query returned:', rawActivities.rows.length, 'activities');
      if (rawActivities.rows.length > 0) {
        console.log('[Activity API] Sample raw activity:', JSON.stringify(rawActivities.rows[0], null, 2));
      }
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
