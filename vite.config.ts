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
        // Target modern browsers for smaller bundle
        target: 'es2020',
        // Chunk size warnings
        chunkSizeWarningLimit: 1000,
        // Enable minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: false, // Keep console logs for debugging
            pure_funcs: ['console.debug'], // Remove debug logs only
          },
        },
        // Enable cache busting with content-based hashes
        rollupOptions: {
          output: {
            // Add hash to entry files
            entryFileNames: 'assets/[name]-[hash].js',
            // Add hash to chunk files
            chunkFileNames: 'assets/[name]-[hash].js',
            // Add hash to asset files (CSS, images, etc.)
            assetFileNames: 'assets/[name]-[hash].[ext]',
            // Manual chunk splitting for better caching
            manualChunks: (id) => {
              // Vendor chunks for better caching
              if (id.includes('node_modules')) {
                // React and related libraries
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                // TipTap editor (large dependency)
                if (id.includes('@tiptap')) {
                  return 'editor-vendor';
                }
                // Supabase client
                if (id.includes('@supabase')) {
                  return 'supabase-vendor';
                }
                // Other large libraries
                if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('reveal.js')) {
                  return 'utils-vendor';
                }
                // Everything else goes to common vendor
                return 'vendor';
              }
            },
          },
        },
        // Ensure consistent hash generation
        assetsInlineLimit: 4096, // Inline small assets < 4KB for fewer requests
      },
    };
});
