require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function clearPlans() {
  const client = await pool.connect();
  try {
    console.log('Clearing old plans...');
    await client.query('DELETE FROM plans;');
    console.log('✓ All plans cleared');
    
    // Now seed new ones
    const plansResult = await client.query(
      `INSERT INTO plans (name, duration_minutes, price, currency, active)
       VALUES 
       ($1, $2, $3, $4, true),
       ($5, $6, $7, $8, true),
       ($9, $10, $11, $12, true),
       ($13, $14, $15, $16, true),
       ($17, $18, $19, $20, true),
       ($21, $22, $23, $24, true),
       ($25, $26, $27, $28, true)
       RETURNING id, name, price;`,
      [
        '1 Hour', 60, 500, 'UGX',
        '3 Hours', 180, 500, 'UGX',
        '6 Hours', 360, 500, 'UGX',
        '12 Hours', 720, 700, 'UGX',
        'Daily', 1440, 1000, 'UGX',
        'Weekly', 10080, 5000, 'UGX',
        'Monthly', 43200, 18000, 'UGX'
      ]
    );
    
    console.log('✓ New plans seeded:');
    plansResult.rows.forEach(p => console.log(`  - ${p.name}: ${p.price} UGX`));
  } finally {
    await client.release();
    await pool.end();
  }
}

clearPlans().catch(console.error);
