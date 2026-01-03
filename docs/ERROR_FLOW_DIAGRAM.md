# Error Handling Flow Diagram

## Overview Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Action                              │
│            (Generate Presentation / Refine Content)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx Handler                               │
│  • handleGenerate() or handleChatRefine()                        │
│  • Calls AI provider service                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 services/ai-provider.ts                          │
│  • generateWithProvider() or refineWithProvider()                │
│  • Validates API keys                                           │
│  • Routes to specific provider                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              services/providers/[provider].ts                    │
│  • DeepSeekProvider / MiniMaxProvider / GLMProvider             │
│  • Makes HTTP request to provider API                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
           ┌─────────┐          ┌─────────┐
           │ Success │          │  Error  │
           └────┬────┘          └────┬────┘
                │                    │
                ▼                    ▼
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Error Occurs                              │
│  • Network failure                                               │
│  • HTTP error (401, 429, 500, etc.)                             │
│  • API validation failure                                       │
│  • Timeout                                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              BaseProvider.handleProviderError()                  │
│  • Captures raw error                                           │
│  • Calls createUserFriendlyError()                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         services/error-handler.ts                                │
│         createUserFriendlyError()                                │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 1. Classify error type:                               │      │
│  │    • Network? → "Connection failed"                   │      │
│  │    • 401? → "Invalid API key"                         │      │
│  │    • 429? → "Too many requests"                       │      │
│  │    • Timeout? → "Request timed out"                   │      │
│  │    • etc.                                             │      │
│  │                                                        │      │
│  │ 2. Generate user-friendly message                     │      │
│  │                                                        │      │
│  │ 3. Add actionable suggestions                         │      │
│  │                                                        │      │
│  │ 4. Determine if retryable                             │      │
│  │                                                        │      │
│  │ 5. Set severity level                                 │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
│  Returns: UserFriendlyError {                                   │
│    userMessage: "Network connection failed..."                  │
│    suggestions: ["Check internet", "Disable VPN", ...]          │
│    retryable: true                                              │
│    severity: 'error'                                            │
│  }                                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              BaseProvider.handleProviderError()                  │
│  • Creates enhanced error object                                │
│  • Attaches validation metadata                                │
│  • Throws enhanced error                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           BaseProvider.makeRequestWithRetry()                    │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ IF error is retryable AND attempts < maxRetries:     │      │
│  │  1. Calculate delay with exponential backoff          │      │
│  │  2. Show progress: "Retrying in 2s... (1/3)"         │      │
│  │  3. Wait for delay                                    │      │
│  │  4. Retry the request                                 │      │
│  │                                                        │      │
│  │ ELSE:                                                 │      │
│  │  Throw error to caller                                │      │
│  └───────────────────────────────────────────────────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx Error Handler                         │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ catch (error) {                                       │      │
│  │   if (error.formattedMessage) {                       │      │
│  │     // Use pre-formatted message from error handler   │      │
│  │     showError(error.formattedMessage)                 │      │
│  │   } else if (error.validation?.suggestions) {         │      │
│  │     // Format manually                                │      │
│  │     showError(formatWithSuggestions(error))           │      │
│  │   } else {                                            │      │
│  │     // Fallback                                       │      │
│  │     showError(error.message)                          │      │
│  │   }                                                   │      │
│  │ }                                                     │      │
│  └───────────────────────────────────────────────────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      User Interface                              │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ Toast Notification / Chat Message:                    │      │
│  │                                                        │      │
│  │ Network connection failed. Please check your          │      │
│  │ internet connection and try again.                    │      │
│  │                                                        │      │
│  │ What you can try:                                     │      │
│  │ 1. Check your internet connection                     │      │
│  │ 2. Verify you can access the internet                 │      │
│  │ 3. Disable any VPN or proxy                           │      │
│  │ 4. Check your firewall settings                       │      │
│  │                                                        │      │
│  │ [In dev mode only:]                                   │      │
│  │ Technical details: TypeError: fetch failed at...      │      │
│  └───────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Retry Flow Detail

```
┌──────────────────────────────────────────────────────────────┐
│                    Error Occurs                               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ Is Retryable?  │
              └────┬───────┬───┘
                   │       │
              Yes  │       │  No
                   ▼       ▼
        ┌──────────────┐  ┌──────────────┐
        │ Check        │  │ Throw error  │
        │ Attempt #    │  │ immediately  │
        └──────┬───────┘  └──────────────┘
               │
               ▼
        ┌──────────────┐
        │ attempt < 3? │
        └──────┬───┬───┘
               │   │
          Yes  │   │  No
               ▼   ▼
    ┌─────────────┐  ┌──────────────┐
    │ Calculate   │  │ Throw error  │
    │ Delay       │  │ (max retries)│
    └──────┬──────┘  └──────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Exponential Backoff:         │
    │ • Attempt 1: ~1-2s           │
    │ • Attempt 2: ~2-4s           │
    │ • Attempt 3: ~4-8s           │
    │ • Add jitter (±20%)          │
    │ • Cap at 30s                 │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Show Progress:               │
    │ "Retrying in 2s... (1/3)"   │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Wait for delay              │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Retry the request           │
    │ (increment attempt counter) │
    └──────┬──────────────────────┘
           │
           └──────────┐
                      │
                      ▼
              ┌────────────────┐
              │ Success or     │
              │ Error?         │
              └────┬───────┬───┘
                   │       │
             Success│     Error│
                   ▼       │
              ┌─────────┐  │
              │ Return  │  │
              │ Result  │  │
              └─────────┘  │
                           │
                           └───► (Loop back to "Is Retryable?")
```

## Error Classification Logic

```
┌────────────────────────────────────────────────────────────┐
│                    Raw Error Input                          │
│  { message: string, status?: number, name?: string }       │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│           Classification Decision Tree                        │
│                                                               │
│  ┌─ error.name === 'TypeError'? ───────► Network Error      │
│  │                                                            │
│  ├─ message.includes('fetch')? ────────► Network Error      │
│  │                                                            │
│  ├─ status === 401? ──────────────────► Auth Error         │
│  │                                                            │
│  ├─ status === 429? ──────────────────► Rate Limit         │
│  │                                                            │
│  ├─ status === 400? ──────────────────► Invalid Request    │
│  │                                                            │
│  ├─ status === 413? ──────────────────► Payload Too Large  │
│  │                                                            │
│  ├─ message.includes('timeout')? ──────► Timeout            │
│  │                                                            │
│  ├─ status >= 500? ───────────────────► Server Error       │
│  │                                                            │
│  ├─ message.includes('not configured')? ► API Key Missing   │
│  │                                                            │
│  ├─ message.includes('filtered')? ─────► Content Moderation │
│  │                                                            │
│  ├─ message.includes('token limit')? ──► Token Limit        │
│  │                                                            │
│  ├─ message.includes('model') +                              │
│  │   'not found'? ──────────────────► Model Not Available  │
│  │                                                            │
│  └─ else ────────────────────────────► Unknown Error       │
│                                                               │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                User-Friendly Error Object                     │
│  {                                                            │
│    userMessage: "Clear, actionable message",                 │
│    technicalMessage: "Full error (dev mode)",                │
│    suggestions: ["Step 1", "Step 2", ...],                   │
│    retryable: boolean,                                        │
│    severity: 'error' | 'warning' | 'info'                    │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
```

## Dev vs Production Mode

```
┌─────────────────────────────────────────────────────────────┐
│                  formatErrorMessage()                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ Check DEV mode │
              │ import.meta.   │
              │ env.DEV        │
              └────┬───────┬───┘
                   │       │
         true ────►│       │◄──── false
                   │       │
                   ▼       ▼
        ┌──────────────┐  ┌──────────────┐
        │ Development  │  │ Production   │
        │ Mode Output  │  │ Mode Output  │
        └──────┬───────┘  └──────┬───────┘
               │                 │
               ▼                 ▼
    ┌──────────────────┐  ┌─────────────────┐
    │ User Message     │  │ User Message    │
    │ +                │  │ +               │
    │ Suggestions      │  │ Suggestions     │
    │ +                │  │                 │
    │ Technical Details│  │ (No Technical)  │
    │ +                │  │                 │
    │ Stack Trace      │  │                 │
    └──────────────────┘  └─────────────────┘
```

## Example: Network Error Journey

```
1. User clicks "Generate Presentation"
   ↓
2. App.tsx calls generateWithProvider()
   ↓
3. DeepSeekProvider makes fetch() request
   ↓
4. Network is down → TypeError: fetch failed
   ↓
5. BaseProvider.handleProviderError() catches it
   ↓
6. createUserFriendlyError() classifies as Network Error
   ↓
7. Returns:
   {
     userMessage: "Network connection failed...",
     suggestions: ["Check internet", "Disable VPN", ...],
     retryable: true,
     severity: 'error'
   }
   ↓
8. makeRequestWithRetry() sees retryable=true
   ↓
9. Waits 1-2 seconds (exponential backoff)
   ↓
10. Shows progress: "Retrying in 2s... (1/3)"
    ↓
11. Retries the fetch() request
    ↓
12. If still fails → Wait 2-4s, retry again
    ↓
13. If 3rd attempt fails → Throw to App.tsx
    ↓
14. App.tsx catches error
    ↓
15. Shows formatted message to user in toast
    ↓
16. User sees:
    "Network connection failed. Please check your
     internet connection and try again.

     What you can try:
     1. Check your internet connection
     2. Verify you can access the internet
     3. Disable any VPN or proxy
     4. Check your firewall settings"
```

## Key Components

```
┌──────────────────────────────────────────────────────────────┐
│                   Component Hierarchy                         │
│                                                               │
│  services/error-handler.ts                                   │
│  ├─ createUserFriendlyError()  ← Main classifier             │
│  ├─ formatErrorMessage()       ← Formatter                   │
│  ├─ isRetryableError()         ← Retry checker               │
│  └─ getRetryDelay()            ← Backoff calculator          │
│                                                               │
│  services/providers/base-provider.ts                         │
│  ├─ handleProviderError()      ← Provider error handler      │
│  └─ makeRequestWithRetry()     ← Retry orchestrator          │
│                                                               │
│  services/api-key-validation.ts                              │
│  ├─ validateAPIKeys()          ← Key validator               │
│  ├─ validateDeepSeekKey()      ← DeepSeek validation         │
│  ├─ validateMiniMaxKey()       ← MiniMax validation          │
│  └─ validateGLMKey()           ← GLM validation              │
│                                                               │
│  App.tsx                                                     │
│  ├─ handleGenerate()           ← Generation error handler    │
│  └─ handleChatRefine()         ← Refinement error handler    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```
