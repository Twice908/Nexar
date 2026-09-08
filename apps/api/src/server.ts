import { verifyToken } from '@clerk/backend';
import cors from '@fastify/cors';
import { eq } from 'drizzle-orm';
import { config as loadEnv } from 'dotenv';
import Fastify, { type FastifyRequest } from 'fastify';
import { z } from 'zod';

import { clusterPairs, commuteRequests, db, users, vehicles } from '@nexar/db';

// Local keys are usually entered once in the web app environment file.
loadEnv({ path: '../../apps/web/.env.local' });
loadEnv({ path: '../../.env.local' });
loadEnv();

const app = Fastify({ logger: true });

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  gender: z.enum(['female', 'male', 'non_binary', 'prefer_not_to_say']),
  homeZoneLabel: z.string().trim().min(2).max(120),
  homeZoneLatitude: z.number().min(-90).max(90),
  homeZoneLongitude: z.number().min(-180).max(180),
  officeBuilding: z.string().trim().min(2).max(120),
  officeEntryWindow: z.string().trim().min(1).max(40),
  commuteDays: z
    .array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']))
    .min(1),
  vehicleModel: z.string().trim().min(2).max(80),
  vehiclePlateNumber: z.string().trim().min(4).max(20),
  vehicleSeatsAvailable: z.number().int().min(3).max(8),
});

type AuthenticatedRequest = FastifyRequest & { clerkUserId?: string | null };

async function getClerkUserId(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!token || !secretKey) {
    return null;
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

app.register(cors, {
  origin: process.env.APP_BASE_URL ?? 'http://localhost:3000',
});

app.addHook('preHandler', async (request) => {
  if (request.url === '/health' || request.method === 'OPTIONS') {
    return;
  }

  (request as AuthenticatedRequest).clerkUserId = await getClerkUserId(request);
});

app.get('/health', async () => ({ status: 'ok', service: 'api' }));

app.get('/v1/onboarding', async (request, reply) => {
  const clerkUserId = (request as AuthenticatedRequest).clerkUserId;
  if (!clerkUserId) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const result = await db
    .select({ user: users, vehicle: vehicles, commuteRequest: commuteRequests })
    .from(users)
    .leftJoin(vehicles, eq(vehicles.userId, users.id))
    .leftJoin(commuteRequests, eq(commuteRequests.userId, users.id))
    .where(eq(users.clerkUserId, clerkUserId));

  if (!result[0]) {
    return reply.send({ complete: false, profile: null });
  }

  return reply.send({
    complete: result[0].user.profileComplete,
    profile: result[0],
  });
});

app.post('/v1/onboarding', async (request, reply) => {
  const clerkUserId = (request as AuthenticatedRequest).clerkUserId;
  if (!clerkUserId) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const parsed = onboardingSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Invalid onboarding data',
      details: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  const clusterPair = await db
    .select({
      residentialClusterId: clusterPairs.residentialClusterId,
      workspaceClusterId: clusterPairs.workspaceClusterId,
    })
    .from(clusterPairs)
    .where(eq(clusterPairs.active, true))
    .limit(1);

  if (!clusterPair[0]) {
    return reply
      .code(503)
      .send({ error: 'No active commute cluster is configured' });
  }

  const activeClusterPair = clusterPair[0];

  const saved = await db.transaction(async (tx) => {
    const existingUser = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId));
    const userValues = {
      clerkUserId,
      name: data.name,
      gender: data.gender,
      homeZoneLabel: data.homeZoneLabel,
      homeZoneLatitude: data.homeZoneLatitude.toFixed(6),
      homeZoneLongitude: data.homeZoneLongitude.toFixed(6),
      officeBuilding: data.officeBuilding,
      officeEntryWindow: data.officeEntryWindow,
      rolePreference: 'car_owner' as const,
      profileComplete: true,
      updatedAt: new Date(),
    };

    const [user] = existingUser[0]
      ? await tx
          .update(users)
          .set(userValues)
          .where(eq(users.id, existingUser[0].id))
          .returning()
      : await tx.insert(users).values(userValues).returning();

    if (!user) {
      throw new Error('Unable to save user profile');
    }

    await tx
      .insert(vehicles)
      .values({
        userId: user.id,
        model: data.vehicleModel,
        plateNumber: data.vehiclePlateNumber.toUpperCase(),
        seatsAvailable: data.vehicleSeatsAvailable,
      })
      .onConflictDoUpdate({
        target: vehicles.userId,
        set: {
          model: data.vehicleModel,
          plateNumber: data.vehiclePlateNumber.toUpperCase(),
          seatsAvailable: data.vehicleSeatsAvailable,
        },
      });

    await tx
      .insert(commuteRequests)
      .values({
        userId: user.id,
        residentialClusterId: activeClusterPair.residentialClusterId,
        workspaceClusterId: activeClusterPair.workspaceClusterId,
        commuteDays: data.commuteDays.join(','),
        active: true,
      })
      .onConflictDoUpdate({
        target: commuteRequests.userId,
        set: {
          commuteDays: data.commuteDays.join(','),
          active: true,
          updatedAt: new Date(),
        },
      });

    return user;
  });

  return reply.code(201).send({ complete: true, profile: saved });
});

const port = Number(process.env.PORT ?? 4000);

app.listen({ host: '0.0.0.0', port }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
