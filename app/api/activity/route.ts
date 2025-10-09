import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use raw SQL query to fetch activities (this approach proved reliable)
    const { sql } = await import('@vercel/postgres');
    const result = await sql`
      SELECT * FROM activities 
      ORDER BY timestamp DESC 
      LIMIT 100
    `;
    
    // Map the raw results to ActivityItem format
    const activities = result.rows.map((row: any) => ({
      type: row.type,
      event_id: row.event_id,
      event_title: row.event_title,
      username: row.username,
      side: row.side,
      amount: row.amount ? parseFloat(row.amount) : undefined,
      winning_side: row.winning_side,
      timestamp: parseInt(row.timestamp),
    }));
    
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
