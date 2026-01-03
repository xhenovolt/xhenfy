import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, ip_address } = body;

    if (!user_id) {
      return Response.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create session
    const result = await query(
      'INSERT INTO sessions (user_id, ip_address, active) VALUES ($1, $2, true) RETURNING id, user_id, start_time, end_time, active, ip_address',
      [user_id, ip_address || null]
    );

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return Response.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return Response.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'SELECT id, user_id, plan_id, start_time, end_time, active, ip_address FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
