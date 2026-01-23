import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 70000,
    hookTimeout: 70000,
    globals: true,
    include: ['test/**/*.test.js'],
    globalSetup: ['./test/support/globalSetup.mjs'],
  },
});
