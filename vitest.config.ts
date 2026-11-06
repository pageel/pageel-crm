// @para-doc [qa-testing-guide.md#testing-architecture-overview]
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'cloudflare:workers': path.resolve(import.meta.dirname, './tests/mocks/cloudflare-workers.ts'),
    },
  },
});
