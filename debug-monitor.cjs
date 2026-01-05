#!/usr/bin/env node
/**
 * Chrome DevTools Protocol Monitor
 * Connects to Chrome and monitors console logs for Gemini errors
 */

const WebSocket = require('ws');

const PAGE_ID = 'CF4A72FFD7A85EA59B16703AD59E2AE5';
const WS_URL = `ws://localhost:9222/devtools/page/${PAGE_ID}`;

console.log('🔍 Connecting to Chrome DevTools Protocol...');
console.log(`   Target: MedGenius - Interactive Medical Education`);
console.log(`   WebSocket: ${WS_URL}\n`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to Chrome DevTools\n');
  console.log('📡 Monitoring console logs (Ctrl+C to stop)...\n');
  console.log('─'.repeat(60));

  // Enable Runtime and Network domains
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Network.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Console.enable' }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  // Console messages
  if (msg.method === 'Console.messageAdded') {
    const entry = msg.params.message;
    const level = entry.level.toUpperCase();
    const text = entry.text;

    // Highlight Gemini-related messages
    if (text.toLowerCase().includes('gemini')) {
      console.log(`\n🔥 [${level}] ${text}`);
      if (entry.stackTrace) {
        console.log('   Stack:', entry.stackTrace.callFrames.slice(0, 3).map(f =>
          `${f.functionName}@${f.url}:${f.lineNumber}`
        ).join('\n         '));
      }
    }
  }

  // Runtime exceptions
  if (msg.method === 'Runtime.exceptionThrown') {
    const exception = msg.params.exceptionDetails;
    const error = exception.exception;

    console.log(`\n❌ EXCEPTION: ${error.description || error.value}`);
    if (exception.stackTrace) {
      console.log('   Stack:', exception.stackTrace.callFrames.slice(0, 3).map(f =>
        `${f.functionName}@${f.url}:${f.lineNumber}`
      ).join('\n         '));
    }
  }

  // Network requests to Gemini API
  if (msg.method === 'Network.requestWillBeSent') {
    const req = msg.params.request;
    if (req.url.includes('generativelanguage.googleapis.com')) {
      console.log(`\n🌐 Gemini API Request: ${req.method} ${req.url.split('?')[0]}`);
    }
  }

  // Network responses
  if (msg.method === 'Network.responseReceived') {
    const res = msg.params.response;
    if (res.url.includes('generativelanguage.googleapis.com')) {
      const status = res.status;
      const statusIcon = status === 200 ? '✅' : '❌';
      console.log(`${statusIcon} Gemini API Response: ${status} ${res.statusText}`);
    }
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  console.log('\n💡 Make sure Chrome DevTools is running:');
  console.log('   ./scripts/launch-chrome-debug.sh 9222 http://localhost:3001');
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n\n👋 Disconnected from Chrome DevTools');
  process.exit(0);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping monitor...');
  ws.close();
});
