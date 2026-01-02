import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env vars with VITE_ prefix for client-side access
    const env = loadEnv(mode, '.', ['VITE_', '']);

    // Get API key from either VITE_GEMINI_API_KEY or legacy GEMINI_API_KEY
    const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Ensure source maps for debugging
      build: {
        sourcemap: true,
      },
    };
});
