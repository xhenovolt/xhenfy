import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const result = await query('SELECT key, value FROM settings ORDER BY key');
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return Response.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return Response.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP RETURNING key, value',
      [key, value]
    );
    
    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return Response.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
