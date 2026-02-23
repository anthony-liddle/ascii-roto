import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/__tests__/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['src/__tests__/integration/**/*.test.ts'],
          testTimeout: 60_000,
        },
      },
    ],
  },
});
