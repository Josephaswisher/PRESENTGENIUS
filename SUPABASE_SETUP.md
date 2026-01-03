# Supabase Setup Guide for PresentGenius

This guide will help you connect PresentGenius to Supabase for cloud storage and synchronization.

## Features Enabled by Supabase

✅ **Cloud Storage** - Save presentations to the cloud
✅ **Prompt History** - Track all your AI generation history
✅ **Multi-Device Sync** - Access your presentations from anywhere
✅ **User Authentication** - Secure user accounts (optional)
✅ **Backup & Recovery** - Never lose your work

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in with GitHub
4. Click "New Project"
5. Fill in:
   - **Project name**: `presentgenius` (or your choice)
   - **Database password**: Choose a strong password
   - **Region**: Select closest to your location
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your API Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values:

   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon/public key** → This is your `VITE_SUPABASE_ANON_KEY`

## Step 3: Add Credentials to .env

Open your `.env` file and add:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Create Database Tables

1. In Supabase dashboard, click **SQL Editor** in sidebar
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

You should see: "Success. No rows returned"

## Step 5: Verify Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Generate a presentation

4. Check Supabase dashboard:
   - Click **Table Editor** in sidebar
   - You should see tables: `presentations` and `prompt_history`
   - Click on `presentations` to see your saved presentation

## What Gets Saved?

Every time you generate a presentation, PresentGenius automatically saves:

- 📄 **Presentation HTML** - The complete generated content
- 💬 **Original Prompt** - What you asked the AI to create
- 🤖 **AI Provider** - Which model was used (DeepSeek V3, etc)
- 📸 **Preview Image** - Thumbnail (if you uploaded files)
- ⏰ **Timestamps** - When created and last updated

## Optional: Enable Authentication

By default, presentations are saved without user accounts. To enable user authentication:

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable your preferred provider (Email, Google, GitHub, etc)
3. Configure the provider settings
4. Update the app to use `supabase.auth.signIn()` before saving

## Troubleshooting

### "Supabase not configured" warning

- Check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in `.env`
- Restart the dev server after adding credentials
- Ensure there are no extra spaces in the values

### Presentations not saving

- Check the browser console for errors
- Verify the SQL schema was run successfully
- Check Supabase logs: **Logs** → **API** in dashboard

### Permission errors

- Ensure Row Level Security (RLS) policies are created
- For anonymous users, make sure the policies allow `user_id IS NULL`

## Database Schema

The schema includes:

### `presentations` table
- `id` - Unique identifier
- `user_id` - User who created it (optional)
- `name` - Presentation name
- `html` - Generated content
- `prompt` - Original user prompt
- `provider` - AI model used
- `original_image` - Preview image
- `created_at`, `updated_at` - Timestamps

### `prompt_history` table
- `id` - Unique identifier
- `presentation_id` - Link to presentation
- `prompt` - User prompt
- `response_preview` - First 500 chars of response
- `provider` - AI model used
- `tokens_used` - API usage
- `created_at` - Timestamp

## Cost

Supabase offers a **generous free tier**:
- 500 MB database storage
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth

Perfect for personal use and small teams!

## Next Steps

Once connected:
- ✨ All presentations auto-save to Supabase
- 🔄 Access from any device
- 📊 View analytics in Supabase dashboard
- 🔐 Enable auth for multi-user support

Need help? Check:
- [Supabase Documentation](https://supabase.com/docs)
- [PresentGenius Issues](https://github.com/your-repo/issues)
