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
    console.log('[Activity API] About to execute raw SELECT query...');
    const rawActivities = await sql`SELECT * FROM activities ORDER BY timestamp DESC LIMIT 10`;
    console.log('[Activity API] Raw query returned:', rawActivities.rows.length, 'activities');
    if (rawActivities.rows.length > 0) {
      console.log('[Activity API] First raw activity:', JSON.stringify(rawActivities.rows[0], null, 2));
    }
    
    // Bypass db.activities.getAll() and manually map the raw results
    console.log('[Activity API] Manually mapping raw activities...');
    const manuallyMappedActivities = rawActivities.rows.map((row: any) => ({
      type: row.type,
      event_id: row.event_id,
      event_title: row.event_title,
      username: row.username,
      side: row.side,
      amount: row.amount ? parseFloat(row.amount) : undefined,
      winning_side: row.winning_side,
      timestamp: parseInt(row.timestamp),
    }));
    console.log('[Activity API] Manually mapped:', manuallyMappedActivities.length, 'activities');
    
    // Also try getAll() for comparison
    console.log('[Activity API] Now trying db.activities.getAll()...');
    const activities = await db.activities.getAll();
    console.log('[Activity API] getAll() returned:', activities.length, 'activities');
    
    if (countResult.rows[0]?.count > 0 && activities.length === 0) {
      console.error('[Activity API] ⚠️  COUNT MISMATCH: DB has', countResult.rows[0]?.count, 'but getAll() returned 0');
      console.log('[Activity API] Returning manually mapped activities instead');
      return NextResponse.json(manuallyMappedActivities);
    }
    
    console.log('[Activity API] ========== END FETCH ==========');
    
    return NextResponse.json(activities.length > 0 ? activities : manuallyMappedActivities);
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
