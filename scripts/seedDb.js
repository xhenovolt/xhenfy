require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('Seeding database with default data...');

    // Clear existing data to reset (remove foreign key dependencies first)
    await client.query('DELETE FROM transactions;');
    await client.query('DELETE FROM wifi_sessions;');
    await client.query('DELETE FROM payments;');
    await client.query('DELETE FROM sessions;');
    await client.query('DELETE FROM plans;');
    console.log('✓ Old data cleared');

    // Insert default plans
    const plansResult = await client.query(
      `INSERT INTO plans (name, duration_minutes, price, currency, active)
       VALUES 
       ($1, $2, $3, $4, true),
       ($5, $6, $7, $8, true),
       ($9, $10, $11, $12, true),
       ($13, $14, $15, $16, true),
       ($17, $18, $19, $20, true)
       RETURNING id, name, price, currency;`,
      [
        '1 Hour', 60, 500, 'UGX',
        '6 Hours', 360, 600, 'UGX',
        '12 Hours', 720, 700, 'UGX',
        'Weekly', 10080, 5500, 'UGX',
        'Monthly', 43200, 25000, 'UGX'
      ]
    );

    console.log('✓ Plans inserted:', plansResult.rows.length);

    // Insert default settings
    const settingsResult = await client.query(
      `INSERT INTO settings (key, value)
       VALUES 
       ($1, $2),
       ($3, $4),
       ($5, $6),
       ($7, $8)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING key, value;`,
      [
        'default_currency', 'UGX',
        'daily_price', '1000',
        'weekly_price', '5000',
        'monthly_price', '18000'
      ]
    );

    console.log('✓ Settings inserted:', settingsResult.rows.length);

    console.log('\n✓ Database seeding completed successfully');
    console.log('\nSeeded Data:');
    console.log('Plans:');
    plansResult.rows.forEach(plan => {
      console.log(`  - ${plan.name}: ${plan.price} ${plan.currency}`);
    });
    console.log('\nSettings:');
    settingsResult.rows.forEach(setting => {
      console.log(`  - ${setting.key}: ${setting.value}`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.release();
  }
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
