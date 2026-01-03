import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const result = await query(
      'SELECT id, name, duration_minutes, price, currency, active FROM plans WHERE active = true ORDER BY duration_minutes'
    );
    
    return Response.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
