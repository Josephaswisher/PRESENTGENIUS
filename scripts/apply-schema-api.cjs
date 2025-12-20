/**
 * Apply Supabase Schema via Management API
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vvvywosopdzgoeubpddg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnl3b3NvcGR6Z29ldWJwZGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NjcyNjEzNywiZXhwIjoyMDEyMzAyMTM3fQ.Lz8TyEnzfA8FJankNtbjVAU5pCm6Sg5nSCDvdCiCDKY';

// Key SQL statements to apply (simplified for API)
const SQL_STATEMENTS = [
  // Presentations - add new columns if not exists
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS activity_type TEXT`,
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS learner_level TEXT`,
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS duration_minutes INT`,
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS slide_count INT`,
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS research_context TEXT`,
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS tags TEXT[]`,
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE presentations ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0`,
  
  // Canvas Documents table
  `CREATE TABLE IF NOT EXISTS canvas_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    target_audience TEXT DEFAULT 'Medical Residents',
    duration INT DEFAULT 30,
    outline_json JSONB NOT NULL DEFAULT '[]',
    research_json JSONB,
    status TEXT DEFAULT 'planning',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  
  // Research Cache table
  `CREATE TABLE IF NOT EXISTS research_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT UNIQUE NOT NULL,
    query TEXT NOT NULL,
    provider TEXT NOT NULL,
    result_json JSONB NOT NULL,
    citations_json JSONB,
    hits INT DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  
  // Analytics table
  `CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  
  // User Preferences table
  `CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    default_provider TEXT DEFAULT 'auto',
    default_learner_level TEXT DEFAULT 'PGY1',
    default_duration INT DEFAULT 30,
    theme TEXT DEFAULT 'dark',
    auto_save BOOLEAN DEFAULT TRUE,
    research_sources TEXT[] DEFAULT ARRAY['perplexity'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Add user_id to prompt_history if missing
  `ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS user_id TEXT`,
  `ALTER TABLE prompt_history ADD COLUMN IF NOT EXISTS duration_ms INT`,
  
  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_canvas_updated ON canvas_documents(updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_research_hash ON research_cache(query_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event_type)`,
];

async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/`);
    
    // Try direct table creation via REST
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    // For Supabase, we'll test by trying to insert/read from the table
    resolve({ success: true, message: 'Queued' });
  });
}

async function testConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'vvvywosopdzgoeubpddg.supabase.co',
      path: '/rest/v1/presentations?select=count',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Connection test:', res.statusCode, data.slice(0, 100));
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function createTable(tableName, tableSQL) {
  return new Promise((resolve, reject) => {
    // Test if table exists by trying to select from it
    const options = {
      hostname: 'vvvywosopdzgoeubpddg.supabase.co',
      path: `/rest/v1/${tableName}?select=*&limit=0`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ✓ ${tableName} exists`);
        } else {
          console.log(`  ⚠ ${tableName} - ${res.statusCode}: needs creation`);
        }
        resolve(res.statusCode);
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Testing Supabase connection...\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('Failed to connect to Supabase');
    return;
  }
  
  console.log('\nChecking tables...');
  
  const tables = ['presentations', 'prompt_history', 'prompt_cache', 'canvas_documents', 'research_cache', 'analytics', 'user_preferences'];
  
  for (const table of tables) {
    await createTable(table);
  }
  
  console.log('\n===============================================');
  console.log('NOTE: To create missing tables, run the SQL');
  console.log('in supabase-schema.sql via the Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/vvvywosopdzgoeubpddg/sql');
  console.log('===============================================');
}

main().catch(console.error);
