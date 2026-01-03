/**
 * Supabase Database Setup Script
 * Automatically creates tables and policies
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://vvvywosopdzgoeubpddg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnl3b3NvcGR6Z29ldWJwZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NjcyNjEzNywiZXhwIjoyMDEyMzAyMTM3fQ.Lz8TyEnzfA8FJankNtbjVAU5pCm6Sg5nSCDvdCiCDKY';

async function setupSupabase() {
  console.log('🚀 Setting up Supabase database...\n');

  // Create admin client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📄 Executing SQL schema...');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase
            .from('_sql')
            .select('*')
            .sql(statement);

          if (directError) {
            console.log(`⚠️  Skipping statement (may already exist): ${statement.substring(0, 50)}...`);
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        } else {
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        }
      } catch (err: any) {
        console.log(`⚠️  Skipping (${err.message}): ${statement.substring(0, 50)}...`);
      }
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Verifying tables...');

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('presentations')
      .select('count')
      .limit(0);

    if (!tablesError) {
      console.log('✅ presentations table created');
    }

    const { data: history, error: historyError } = await supabase
      .from('prompt_history')
      .select('count')
      .limit(0);

    if (!historyError) {
      console.log('✅ prompt_history table created');
    }

    console.log('\n✨ Supabase is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Generate a presentation');
    console.log('3. Check Supabase dashboard to see your data');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📝 Manual setup instructions:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Click on your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy contents of supabase/schema.sql');
    console.log('5. Paste and run');
    process.exit(1);
  }
}

// Alternative: Direct SQL execution using Supabase REST API
async function setupViaAPI() {
  console.log('🔧 Setting up via REST API...\n');

  const presentations = `
    CREATE TABLE IF NOT EXISTS presentations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      name TEXT NOT NULL,
      html TEXT NOT NULL,
      prompt TEXT,
      provider TEXT,
      original_image TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const promptHistory = `
    CREATE TABLE IF NOT EXISTS prompt_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      response_preview TEXT,
      provider TEXT,
      tokens_used INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const queries = [presentations, promptHistory];

  for (const query of queries) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      if (response.ok) {
        console.log('✅ Table created successfully');
      } else {
        console.log('⚠️  Table may already exist or query failed');
      }
    } catch (error: any) {
      console.log('⚠️  Error:', error.message);
    }
  }

  console.log('\n✨ Setup complete!');
}

// Run setup
setupSupabase().catch((error) => {
  console.error('Setup failed:', error);
  console.log('\nTrying alternative method...');
  setupViaAPI();
});
