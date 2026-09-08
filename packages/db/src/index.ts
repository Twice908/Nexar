import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as schema from './schema';

const connection = postgres(
  process.env.DATABASE_URL ?? 'postgres://nexar:nexar@localhost:15432/nexar',
);

export const db = drizzle(connection, { schema });
export { connection };
export * from './schema';
