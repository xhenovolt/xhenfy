import { query } from '@/lib/db';

/**
 * GET /api/debug/plans
 * Debug endpoint to check what plans exist
 */
export async function GET() {
  try {
    const result = await query('SELECT * FROM plans');
    return Response.json({
      success: true,
      plans: result.rows,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
