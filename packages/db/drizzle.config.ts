import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnv({ path: '../../apps/web/.env.local' });
loadEnv({ path: '../../.env.local' });
loadEnv();

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL?.startsWith('postgres')
      ? process.env.DATABASE_URL
      : 'postgres://nexar:nexar@localhost:15432/nexar',
  },
});
