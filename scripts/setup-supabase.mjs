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

  // Create slide_annotations table
  const createSlideAnnotations = `
    CREATE TABLE IF NOT EXISTS slide_annotations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      presentation_id TEXT NOT NULL,
      slide_index INTEGER NOT NULL,
      strokes JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_slide_annotation UNIQUE(presentation_id, slide_index, created_by)
    );

    CREATE INDEX IF NOT EXISTS idx_annotations_presentation ON slide_annotations(presentation_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_slide ON slide_annotations(presentation_id, slide_index);
  `;

  console.log('→ Creating slide_annotations table...');
  const { error: err3 } = await runSQL(createSlideAnnotations);
  if (err3) {
    const { error: insertError } = await supabase
      .from('slide_annotations')
      .select('id')
      .limit(1);

    if (!insertError) {
      console.log('  ✅ slide_annotations table exists\n');
    } else {
      console.log('  ⚠️  Could not verify slide_annotations table\n');
    }
  } else {
    console.log('  ✅ slide_annotations table created\n');
  }

  // Create presentation_versions table
  const createPresentationVersions = `
    CREATE TABLE IF NOT EXISTS presentation_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      presentation_id UUID NOT NULL,
      version_number INTEGER NOT NULL,
      snapshot JSONB NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_version UNIQUE(presentation_id, version_number)
    );

    CREATE INDEX IF NOT EXISTS idx_presentation_versions_presentation_id ON presentation_versions(presentation_id);
    CREATE INDEX IF NOT EXISTS idx_presentation_versions_created_at ON presentation_versions(created_at DESC);
  `;

  console.log('→ Creating presentation_versions table...');
  const { error: err4 } = await runSQL(createPresentationVersions);
  if (err4) {
    const { error: insertError } = await supabase
      .from('presentation_versions')
      .select('id')
      .limit(1);

    if (!insertError) {
      console.log('  ✅ presentation_versions table exists\n');
    } else {
      console.log('  ⚠️  Could not verify presentation_versions table\n');
    }
  } else {
    console.log('  ✅ presentation_versions table created\n');
  }

  // Enable RLS
  console.log('→ Enabling Row Level Security...');
  await runSQL('ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;');
  await runSQL('ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;');
  await runSQL('ALTER TABLE slide_annotations ENABLE ROW LEVEL SECURITY;');
  await runSQL('ALTER TABLE presentation_versions ENABLE ROW LEVEL SECURITY;');
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

  // Policies for slide_annotations (allow anonymous access for now)
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous select annotations" ON slide_annotations
    FOR SELECT USING (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous insert annotations" ON slide_annotations
    FOR INSERT WITH CHECK (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous update annotations" ON slide_annotations
    FOR UPDATE USING (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous delete annotations" ON slide_annotations
    FOR DELETE USING (true);
  `);

  // Policies for presentation_versions (allow anonymous access for now)
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous select versions" ON presentation_versions
    FOR SELECT USING (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous insert versions" ON presentation_versions
    FOR INSERT WITH CHECK (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous update versions" ON presentation_versions
    FOR UPDATE USING (true);
  `);
  await runSQL(`
    CREATE POLICY IF NOT EXISTS "Allow anonymous delete versions" ON presentation_versions
    FOR DELETE USING (true);
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
