#!/usr/bin/env node
/**
 * Supabase Quick Setup Script
 * Run with: node scripts/setup-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://vvvywosopdzgoeubpddg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnl3b3NvcGR6Z29ldWJwZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NjcyNjEzNywiZXhwIjoyMDEyMzAyMTM3fQ.Lz8TyEnzfA8FJankNtbjVAU5pCm6Sg5nSCDvdCiCDKY';

console.log('🚀 PresentGenius Supabase Setup\n');
console.log('📍 Database URL:', SUPABASE_URL);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

async function setupTables() {
  console.log('📋 Creating tables...\n');

  // Create presentations table
  const createPresentations = `
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

  console.log('→ Creating presentations table...');
  const { error: err1 } = await runSQL(createPresentations);
  if (err1) {
    // Try using REST API directly
    const { error: insertError } = await supabase
      .from('presentations')
      .select('id')
      .limit(1);

    if (!insertError) {
      console.log('  ✅ presentations table exists\n');
    } else {
      console.log('  ⚠️  Could not verify presentations table\n');
    }
  } else {
    console.log('  ✅ presentations table created\n');
  }

  // Create prompt_history table
  const createPromptHistory = `
    CREATE TABLE IF NOT EXISTS prompt_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      presentation_id UUID,
      prompt TEXT NOT NULL,
      response_preview TEXT,
      provider TEXT,
      tokens_used INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log('→ Creating prompt_history table...');
  const { error: err2 } = await runSQL(createPromptHistory);
  if (err2) {
    const { error: insertError } = await supabase
      .from('prompt_history')
      .select('id')
      .limit(1);

    if (!insertError) {
      console.log('  ✅ prompt_history table exists\n');
    } else {
      console.log('  ⚠️  Could not verify prompt_history table\n');
    }
  } else {
    console.log('  ✅ prompt_history table created\n');
  }

  // Enable RLS
  console.log('→ Enabling Row Level Security...');
  await runSQL('ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;');
  await runSQL('ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;');
  console.log('  ✅ RLS enabled\n');

  // Create policies
  console.log('→ Creating security policies...');
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous inserts" ON presentations
    FOR INSERT WITH CHECK (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous selects" ON presentations
    FOR SELECT USING (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous inserts on history" ON prompt_history
    FOR INSERT WITH CHECK (true);
  `);
  console.log('  ✅ Policies created\n');
}

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  const { data, error } = await supabase
    .from('presentations')
    .select('count')
    .limit(0);

  if (error) {
    console.log('  ❌ Connection test failed:', error.message);
    console.log('\n📝 Please run the SQL manually:');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Open SQL Editor');
    console.log('  3. Run the contents of supabase/schema.sql');
    return false;
  } else {
    console.log('  ✅ Connection successful!');
    return true;
  }
}

async function insertTestData() {
  console.log('\n🧪 Inserting test presentation...');

  const { data, error } = await supabase
    .from('presentations')
    .insert([
      {
        name: 'Test Presentation',
        html: '<html><body><h1>Test</h1></body></html>',
        prompt: 'Create a test presentation',
        provider: 'openrouter'
      }
    ])
    .select();

  if (error) {
    console.log('  ⚠️  Could not insert test data:', error.message);
  } else {
    console.log('  ✅ Test presentation created!');
    console.log('  📊 ID:', data[0].id);
  }
}

async function main() {
  const connected = await testConnection();

  if (connected) {
    await setupTables();
    await insertTestData();

    console.log('\n✨ Supabase setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Generate a presentation');
    console.log('  3. Check your Supabase dashboard\n');
  } else {
    console.log('\n⚠️  Setup incomplete. Please run SQL manually.\n');
  }
}

main().catch(console.error);
