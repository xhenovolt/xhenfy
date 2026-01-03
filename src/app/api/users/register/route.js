import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone_number, mac_address } = body;

    if (!phone_number) {
      return Response.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let result = await query(
      'SELECT id, phone_number, status FROM users WHERE phone_number = $1',
      [phone_number]
    );

    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      // Create new user
      result = await query(
        'INSERT INTO users (phone_number, mac_address, status) VALUES ($1, $2, $3) RETURNING id, phone_number, mac_address, status, first_seen, last_seen',
        [phone_number, mac_address || null, 'active']
      );
      user = result.rows[0];
    }

    return Response.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return Response.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
