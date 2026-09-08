import 'dotenv/config';
import { eq } from 'drizzle-orm';

import { clusterPairs, clusters, db } from './index';

const [residentialCluster] = await db
  .insert(clusters)
  .values({ name: 'Pilot Residential Cluster', kind: 'residential' })
  .onConflictDoNothing()
  .returning();

const [workspaceCluster] = await db
  .insert(clusters)
  .values({ name: 'Pilot Workspace Cluster', kind: 'workspace' })
  .onConflictDoNothing()
  .returning();

if (residentialCluster && workspaceCluster) {
  await db.insert(clusterPairs).values({
    residentialClusterId: residentialCluster.id,
    workspaceClusterId: workspaceCluster.id,
    active: true,
  });
}

const activePair = await db
  .select()
  .from(clusterPairs)
  .where(eq(clusterPairs.active, true));
console.log(`Nexar seed ready: ${activePair.length} active cluster pair(s).`);
