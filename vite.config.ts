import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `npm run dev:phone` runs with --mode phone: it serves over HTTPS on the LAN,
// because browsers only allow microphone access on secure origins.
export default defineConfig(({ mode }) => ({
  // Relative asset paths so the build works from any sub-path (e.g. GitHub Pages).
  base: './',
  plugins: [react(), ...(mode === 'phone' ? [basicSsl()] : [])],
  test: {
    include: ['src/**/*.test.ts'],
  },
}));
