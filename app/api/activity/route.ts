import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Activity API] ========== START FETCH ==========');
    console.log('[Activity API] Timestamp:', Date.now());
    
    // First check if table exists and has data
    const { sql } = await import('@vercel/postgres');
    
    // Check table structure
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'activities'
        ORDER BY ordinal_position
      `;
      console.log('[Activity API] Table structure:', JSON.stringify(tableInfo.rows, null, 2));
    } catch (e) {
      console.error('[Activity API] Could not fetch table structure:', e);
    }
    
    const countResult = await sql`SELECT COUNT(*) as count FROM activities`;
    console.log('[Activity API] Raw count from database:', countResult.rows[0]?.count);
    
    // Try raw query first to see what's in the database
    const rawActivities = await sql`SELECT * FROM activities ORDER BY timestamp DESC LIMIT 10`;
    console.log('[Activity API] Raw query returned:', rawActivities.rows.length, 'activities');
    if (rawActivities.rows.length > 0) {
      console.log('[Activity API] Raw activities:', JSON.stringify(rawActivities.rows, null, 2));
    }
    
    const activities = await db.activities.getAll();
    console.log('[Activity API] Found activities after getAll():', activities.length);
    
    if (activities.length > 0) {
      console.log('[Activity API] Processed activities:', JSON.stringify(activities, null, 2));
    } else if (countResult.rows[0]?.count > 0) {
      console.error('[Activity API] ⚠️  COUNT MISMATCH: DB has', countResult.rows[0]?.count, 'but getAll() returned 0');
    }
    
    console.log('[Activity API] ========== END FETCH ==========');
    
    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('[Activity API] Error fetching activities:', error);
    console.error('[Activity API] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
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
