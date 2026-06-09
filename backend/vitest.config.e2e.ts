import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { decoratorMetadata: true, legacyDecorator: true },
        target: 'es2021',
        keepClassNames: true,
      },
    }),
  ],
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    env: {
      NODE_ENV: 'test',
    },
  },
});
