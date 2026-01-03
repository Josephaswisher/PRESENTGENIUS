#!/usr/bin/env node

/**
 * API Connection Diagnostic Tool
 * Tests DeepSeek, MiniMax, and GLM API connectivity
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '.env.local');
let env = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    key: env.VITE_DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
  },
  minimax: {
    name: 'MiniMax',
    endpoint: 'https://api.minimax.io/v1/text/chatcompletion_v2',
    key: env.VITE_MINIMAX_API_KEY,
    model: 'MiniMax-M2.1',
  },
  glm: {
    name: 'GLM (Zhipu AI)',
    endpoint: 'https://api.z.ai/api/paas/v4/chat/completions',
    key: env.VITE_GLM_API_KEY,
    model: 'glm-4.7',
  },
};

async function testProvider(providerId) {
  const provider = PROVIDERS[providerId];
  console.log(`\n🧪 Testing ${provider.name}...`);
  console.log(`   Endpoint: ${provider.endpoint}`);
  console.log(`   API Key: ${provider.key ? '✓ Set' : '✗ Missing'}`);

  if (!provider.key) {
    console.log(`   ❌ SKIP: No API key configured\n`);
    return { provider: providerId, success: false, error: 'No API key' };
  }

  const testMessage = {
    model: provider.model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "API connection successful" and nothing else.' }
    ],
    max_tokens: 50,
  };

  // Add reasoning flag for MiniMax
  if (providerId === 'minimax') {
    testMessage.reasoning = true;
  }

  try {
    console.log(`   📡 Sending test request...`);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    console.log(`   📥 Response received in ${elapsed}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${response.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      return { provider: providerId, success: false, error: `HTTP ${response.status}`, details: errorText };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`   ✅ SUCCESS!`);
    console.log(`   Response: "${content.substring(0, 100)}"`);

    return { provider: providerId, success: true, elapsed };

  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    if (error.name === 'AbortError') {
      console.log(`   Reason: Request timed out after 30 seconds`);
    }
    return { provider: providerId, success: false, error: error.message };
  }
}

async function runDiagnostics() {
  console.log('🔍 AI Provider Connection Diagnostics');
  console.log('=====================================\n');

  const results = [];
  for (const providerId of Object.keys(PROVIDERS)) {
    const result = await testProvider(providerId);
    results.push(result);
  }

  console.log('\n📊 Summary');
  console.log('==========');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const info = r.success ? `(${r.elapsed}ms)` : `(${r.error})`;
    console.log(`${status} ${PROVIDERS[r.provider].name} ${info}`);
  });

  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log('\n🎉 All providers working correctly!');
  } else {
    console.log('\n⚠️  Some providers failed - check API keys and network connectivity');
  }
}

runDiagnostics().catch(console.error);
