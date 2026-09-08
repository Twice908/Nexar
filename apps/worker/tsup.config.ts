import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/worker.ts'],
  format: ['esm'],
  dts: true,
  noExternal: ['@nexar/db', '@nexar/matching'],
});
