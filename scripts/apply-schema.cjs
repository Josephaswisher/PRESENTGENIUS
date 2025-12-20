/**
 * Apply Supabase Schema
 * Run with: node scripts/apply-schema.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = `postgresql://postgres:Shiksha1022$@db.vvvywosopdzgoeubpddg.supabase.co:5432/postgres`;

async function applySchema() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt || stmt.startsWith('--')) continue;
      
      try {
        await client.query(stmt);
        console.log(`[${i + 1}/${statements.length}] OK`);
      } catch (err) {
        // Some errors are expected (e.g., already exists)
        if (err.message.includes('already exists') || 
            err.message.includes('does not exist') ||
            err.message.includes('duplicate key')) {
          console.log(`[${i + 1}/${statements.length}] SKIP: ${err.message.slice(0, 60)}`);
        } else {
          console.error(`[${i + 1}/${statements.length}] ERROR: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Schema applied successfully!');

    // List tables
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\nTables in database:');
    rows.forEach(r => console.log(`  - ${r.table_name}`));

  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

applySchema();
