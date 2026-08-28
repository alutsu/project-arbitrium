import { defineConfig } from 'vitest/config';

const DEV_SERVER_PORT = 5173;
const BUILD_TARGET = 'es2022';

export default defineConfig({
  server: { port: DEV_SERVER_PORT },
  build: { target: BUILD_TARGET, sourcemap: true },
  test: {
    // Pure game logic is Phaser-free (CLAUDE.md 3.5), so it needs no DOM.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
