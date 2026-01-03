# Chat Refinement Debugging Guide

## 🔍 Systematic A/B Testing Protocol

I've added comprehensive diagnostic logging to track exactly where the refinement is failing. Follow these tests in order:

---

## ✅ Test 1: Check Console Logs

**Action:** Open browser DevTools Console and try a refinement.

**Expected Logs (in order):**
```
🔵 [Chat Refinement] Starting refinement...
📝 User message: [your message]
📄 Current HTML length: [number]
🤖 Provider: openrouter
⏳ Calling refineWithProvider...
🔧 [AI Provider] refineWithProvider called
📊 Stats: { provider, htmlLength, instructionLength, totalInputSize }
🔐 [AI Provider] Validating API keys...
🔑 [AI Provider] Validation result: { isValid, provider, hasKey, keyPrefix }
✅ [AI Provider] Validation passed, calling openrouter.refineArtifact...
🌐 [OpenRouter] refineWithOpenRouter called
📊 Request details: { model, htmlLength, instructionLength, estimatedTokens }
🔑 [OpenRouter] Getting API key...
✅ [OpenRouter] API key obtained
📨 [OpenRouter] Messages structure: { messageCount, systemMessageLength, userMessageLength, totalMessageLength }
🚀 [OpenRouter] Making API request...
📥 [OpenRouter] API response received: { hasChoices, choicesLength, hasContent }
✨ [OpenRouter] Extraction complete: { contentLength, resultLength, hadHtmlMatch, startsWithDoctype }
✅ [AI Provider] Refinement successful, result length: [number]
✅ Received response, length: [number]
🏁 [Chat Refinement] Finished (isRefining = false)
```

**What to look for:**
- Does it fail at validation? → Test 2 (API Key)
- Does it fail at "Making API request"? → Test 3 (Network/API)
- Does it succeed but UI doesn't update? → Test 4 (State Updates)
- Does estimatedTokens > 60000? → Test 5 (Context Length)

---

## ✅ Test 2: API Key Validation

**Check if your API key is set:**
```bash
# Open a terminal in your project directory
cat .env | grep VITE_OPENROUTER_API_KEY
```

**Expected:** `VITE_OPENROUTER_API_KEY=sk-or-v1-...`

**Fixes if missing:**
1. Copy `.env.example` to `.env`: `cp .env.example .env`
2. Get an OpenRouter API key from: https://openrouter.ai/keys
3. Edit `.env` and add your key
4. **IMPORTANT:** Restart your dev server: `npm run dev`

**Test in console:**
```javascript
// Paste this in browser console
console.log('API Key check:', {
  hasKey: !!import.meta.env.VITE_OPENROUTER_API_KEY,
  keyStart: import.meta.env.VITE_OPENROUTER_API_KEY?.substring(0, 10)
});
```

---

## ✅ Test 3: Minimal Input Test (Isolate Context Length)

**Action:** Test with a TINY HTML document to rule out token limits.

**Test HTML:**
```html
<!DOCTYPE html>
<html><body><h1>Test</h1></body></html>
```

**How to test:**
1. Create a new presentation (minimal prompt: "hello world")
2. Wait for it to generate
3. In chat, type: "make the heading red"
4. Check console logs

**Expected:** Should work if API key is valid.

**If this works but normal presentations don't:**
→ Your presentations are too large. Check console for `estimatedTokens` - if > 60,000, the model's context is exceeded.

**Fix for large presentations:**
- Use a model with larger context (e.g., claude-3.5-sonnet instead of deepseek)
- Or generate shorter presentations initially

---

## ✅ Test 4: Check Network/API Response

**Action:** Open DevTools → Network tab

**Look for:**
1. Request to `openrouter.ai/api/v1/chat/completions`
2. Check the response:
   - **200 OK** = API worked, check response body
   - **400 Bad Request** = Malformed request (check payload in Request tab)
   - **401 Unauthorized** = Invalid API key
   - **429 Too Many Requests** = Rate limited
   - **500 Server Error** = OpenRouter issue

**Check the request payload:**
- Click the request → Payload tab
- Verify `model: "deepseek/deepseek-chat"`
- Check `messages` array structure
- Look at total message length

**Check the response:**
- Click Response tab
- Look for `choices[0].message.content`
- Does it contain HTML?

---

## ✅ Test 5: State Update Verification

**If refinement succeeds but UI doesn't update:**

**Test in console while refining:**
```javascript
// Watch for state changes
let originalHtml = null;

// Before refinement, store current HTML
// (Open the presentation first)

// After clicking chat refinement, check:
setTimeout(() => {
  console.log('State check:', {
    hasActiveCreation: !!window.React, // Just a proxy
    // You'll see the actual state in React DevTools
  });
}, 5000);
```

**Better: Use React DevTools**
1. Install React DevTools extension
2. Open Components tab
3. Find `App` component
4. Watch `activeCreation.html` before and after refinement
5. Does it change?

**If state changes but preview doesn't update:**
- The iframe might not be re-rendering
- Check if `creation` prop changed in LivePreview

---

## ✅ Test 6: Error Detection

**Action:** Intentionally break something to verify error display works.

**Test 1: Invalid API Key**
```bash
# Edit .env temporarily
VITE_OPENROUTER_API_KEY=invalid_key_test
# Restart dev server
npm run dev
```

**Expected:** Error in chat: "❌ Refinement Error: Invalid OpenRouter API key format..."

**Test 2: Network Error**
```javascript
// In DevTools Console, block the request:
// Network tab → Request blocking → Add pattern: *openrouter.ai*
```

**Expected:** Error in chat with network-related message

---

## 📊 Common Issues & Solutions

| Symptom | Console Shows | Cause | Fix |
|---------|---------------|-------|-----|
| Nothing happens | No logs at all | Chat not triggering | Check ChatPanel is visible and not disabled |
| Stops at "Validating" | `isValid: false` | Missing/invalid API key | Check .env file, restart dev server |
| 400 error | `estimatedTokens > 60000` | Content too large | Use smaller HTML or different model |
| 401 error | API request fails | Wrong API key | Get new key from OpenRouter |
| Success but no UI change | All logs succeed | State update issue | Check `handleUpdateHtml` is called |
| Response is empty | `resultLength: 0` | Model returned non-HTML | Check response content in Network tab |

---

## 🧪 Quick Test Script

**Paste this in browser console for automated check:**

```javascript
(async function debugRefinement() {
  console.log('🧪 Running Refinement Debug Tests...\n');

  // Test 1: API Key
  const hasKey = !!import.meta.env.VITE_OPENROUTER_API_KEY;
  console.log('✓ API Key:', hasKey ? '✅ Present' : '❌ Missing');
  if (hasKey) {
    console.log('  Key prefix:', import.meta.env.VITE_OPENROUTER_API_KEY.substring(0, 15) + '...');
  }

  // Test 2: Network
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}` }
    });
    console.log('✓ Network:', response.ok ? '✅ Connected' : `⚠️  Status ${response.status}`);
  } catch (e) {
    console.log('✓ Network:', '❌ Failed -', e.message);
  }

  // Test 3: Check for errors in console
  console.log('\n📋 Next steps:');
  console.log('1. Try a chat refinement');
  console.log('2. Watch the console for emoji logs (🔵 🔧 🌐)');
  console.log('3. If it fails, note which step fails');
  console.log('4. Match the failure to the table above');
})();
```

---

## 🎯 Expected Behavior

**When working correctly:**
1. Type message in chat → Click send
2. Message appears in chat panel as "user" message
3. Chat shows "Processing..." or loading indicator
4. Console shows all emoji logs in sequence
5. ~2-10 seconds later, chat shows "assistant" response
6. Preview iframe updates with changes

**Total time:** 2-10 seconds depending on model and request size

---

## 📞 Report Results

After running these tests, report:
1. Which test failed?
2. Console error messages
3. Network tab status code
4. Estimated tokens from console

This will pinpoint the exact issue!
