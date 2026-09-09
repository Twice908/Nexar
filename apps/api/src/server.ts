import { createClerkClient, verifyToken } from '@clerk/backend';
import cors from '@fastify/cors';
import { and, eq } from 'drizzle-orm';
import { config as loadEnv } from 'dotenv';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { z } from 'zod';

import {
  rideRequestSchema,
  rideRequestUpdateSchema,
  type RideRole,
} from '@nexar/contracts';
import {
  clusterPairs,
  commuteRequests,
  db,
  notifications,
  tripMembers,
  trips,
  users,
  vehicles,
} from '@nexar/db';

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
  rolePreference: z.enum(['driver', 'passenger', 'both']).default('both'),
});

type ClerkIdentity = {
  userId: string;
  imageUrl: string | null;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  workEmailVerified: boolean;
  isVerified: boolean;
};

type AuthenticatedRequest = FastifyRequest & {
  clerkIdentity?: ClerkIdentity | null;
};

async function getClerkIdentity(request: FastifyRequest) {
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
    if (typeof payload.sub !== 'string') {
      return null;
    }

    const clerkClient = createClerkClient({ secretKey });
    const clerkUser = await clerkClient.users.getUser(payload.sub);
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
    const phone = clerkUser.primaryPhoneNumber?.phoneNumber ?? null;
    const emailVerified =
      clerkUser.primaryEmailAddress?.verification?.status === 'verified';
    const phoneVerified =
      clerkUser.primaryPhoneNumber?.verification?.status === 'verified';
    const workplaceDomain = (process.env.WORKPLACE_EMAIL_DOMAIN ?? '')
      .trim()
      .toLowerCase()
      .replace(/^@/, '');
    const workEmailVerified =
      emailVerified &&
      workplaceDomain.length > 0 &&
      email?.toLowerCase().endsWith(`@${workplaceDomain}`) === true;

    return {
      userId: payload.sub,
      imageUrl: clerkUser.imageUrl ?? null,
      email,
      phone,
      emailVerified,
      phoneVerified,
      workEmailVerified,
      isVerified: emailVerified && phoneVerified && workEmailVerified,
    };
  } catch {
    return null;
  }
}

function verificationResponse(identity: ClerkIdentity | null) {
  return {
    email: identity?.email ?? null,
    phone: identity?.phone ?? null,
    emailVerified: identity?.emailVerified ?? false,
    phoneVerified: identity?.phoneVerified ?? false,
    workEmailVerified: identity?.workEmailVerified ?? false,
    isVerified: identity?.isVerified ?? false,
  };
}

function profileRolePreference(role: string) {
  return role === 'car_owner' ? 'driver' : role;
}

async function getCurrentUser(clerkUserId: string) {
  const result = await db
    .select({ user: users, commuteRequest: commuteRequests })
    .from(users)
    .leftJoin(commuteRequests, eq(commuteRequests.userId, users.id))
    .where(eq(users.clerkUserId, clerkUserId));

  return result[0] ?? null;
}

function rideRequestResponse(
  user: typeof users.$inferSelect,
  request: typeof commuteRequests.$inferSelect,
) {
  const role = profileRolePreference(user.rolePreference);
  return {
    id: request.id,
    role: role === 'passenger' ? 'passenger' : 'driver',
    commuteDays: request.commuteDays.split(',').filter(Boolean),
    active: request.active,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

async function saveRideRequest(
  clerkUserId: string,
  role: RideRole,
  commuteDays: string[],
) {
  const currentUser = await getCurrentUser(clerkUserId);
  if (!currentUser) {
    return {
      error: 'Complete your commute profile before creating a request',
      code: 409,
    } as const;
  }

  const clusterPair = await db
    .select({
      residentialClusterId: clusterPairs.residentialClusterId,
      workspaceClusterId: clusterPairs.workspaceClusterId,
    })
    .from(clusterPairs)
    .where(eq(clusterPairs.active, true))
    .limit(1);

  if (!clusterPair[0] && !currentUser.commuteRequest) {
    return {
      error: 'No active commute cluster is configured',
      code: 503,
    } as const;
  }

  const saved = await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ rolePreference: role, updatedAt: new Date() })
      .where(eq(users.id, currentUser.user.id));

    const [request] = currentUser.commuteRequest
      ? await tx
          .update(commuteRequests)
          .set({
            ...(clusterPair[0]
              ? {
                  residentialClusterId: clusterPair[0].residentialClusterId,
                  workspaceClusterId: clusterPair[0].workspaceClusterId,
                }
              : {}),
            commuteDays: commuteDays.join(','),
            active: true,
            updatedAt: new Date(),
          })
          .where(eq(commuteRequests.id, currentUser.commuteRequest.id))
          .returning()
      : await tx
          .insert(commuteRequests)
          .values({
            userId: currentUser.user.id,
            residentialClusterId: clusterPair[0]!.residentialClusterId,
            workspaceClusterId: clusterPair[0]!.workspaceClusterId,
            commuteDays: commuteDays.join(','),
            active: true,
          })
          .returning();

    if (!request) {
      throw new Error('Unable to save ride request');
    }
    return { user: { ...currentUser.user, rolePreference: role }, request };
  });

  return {
    ...rideRequestResponse(saved.user, saved.request),
  };
}

app.register(cors, {
  origin: true,
});

app.addHook('preHandler', async (request) => {
  if (request.url === '/health' || request.method === 'OPTIONS') {
    return;
  }

  (request as AuthenticatedRequest).clerkIdentity =
    await getClerkIdentity(request);
});

app.get('/health', async () => ({ status: 'ok', service: 'api' }));

app.get('/v1/onboarding', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const result = await db
    .select({ user: users, vehicle: vehicles, commuteRequest: commuteRequests })
    .from(users)
    .leftJoin(vehicles, eq(vehicles.userId, users.id))
    .leftJoin(commuteRequests, eq(commuteRequests.userId, users.id))
    .where(eq(users.clerkUserId, clerkIdentity.userId));

  if (!result[0]) {
    return reply.send({
      complete: false,
      profile: null,
      verification: verificationResponse(clerkIdentity),
    });
  }

  const { user, vehicle, commuteRequest } = result[0];

  return reply.send({
    complete: user.profileComplete,
    verification: verificationResponse(clerkIdentity),
    profile: user.profileComplete
      ? {
          name: user.name,
          profileImageUrl: user.profileImageUrl ?? clerkIdentity.imageUrl,
          gender: user.gender,
          rolePreference: profileRolePreference(user.rolePreference),
          homeZoneLabel: user.homeZoneLabel,
          homeZoneLatitude: Number(user.homeZoneLatitude),
          homeZoneLongitude: Number(user.homeZoneLongitude),
          officeBuilding: user.officeBuilding,
          officeEntryWindow: user.officeEntryWindow,
          commuteDays: commuteRequest?.commuteDays
            ? commuteRequest.commuteDays.split(',').filter(Boolean)
            : [],
          vehicleModel: vehicle?.model ?? '',
          vehiclePlateNumber: vehicle?.plateNumber ?? '',
          vehicleSeatsAvailable: vehicle?.seatsAvailable ?? 3,
        }
      : null,
  });
});

app.get('/v1/ride-requests', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  return reply.send({
    requests: currentUser?.commuteRequest
      ? [rideRequestResponse(currentUser.user, currentUser.commuteRequest)]
      : [],
  });
});

async function createRideRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  role: RideRole,
) {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const parsed = rideRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Invalid recurring ride request',
      details: parsed.error.flatten(),
    });
  }

  const saved = await saveRideRequest(
    clerkIdentity.userId,
    role,
    parsed.data.commuteDays,
  );
  if ('error' in saved) {
    return reply.code(saved.code ?? 400).send({ error: saved.error });
  }

  return reply.code(201).send({ request: saved });
}

app.post('/v1/ride-requests/offer', async (request, reply) =>
  createRideRequest(request, reply, 'driver'),
);

app.post('/v1/ride-requests/request', async (request, reply) =>
  createRideRequest(request, reply, 'passenger'),
);

app.patch('/v1/ride-requests/:id', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  const params = request.params as { id?: string };
  if (
    !currentUser?.commuteRequest ||
    currentUser.commuteRequest.id !== params.id
  ) {
    return reply.code(404).send({ error: 'Ride request not found' });
  }

  const parsed = rideRequestUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Invalid recurring ride request',
      details: parsed.error.flatten(),
    });
  }

  const [updated] = await db.transaction(async (tx) => {
    if (parsed.data.role) {
      await tx
        .update(users)
        .set({ rolePreference: parsed.data.role, updatedAt: new Date() })
        .where(eq(users.id, currentUser.user.id));
    }

    return tx
      .update(commuteRequests)
      .set({
        ...(parsed.data.commuteDays
          ? { commuteDays: parsed.data.commuteDays.join(',') }
          : {}),
        ...(parsed.data.active === undefined
          ? {}
          : { active: parsed.data.active }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(commuteRequests.id, currentUser.commuteRequest!.id),
          eq(commuteRequests.userId, currentUser.user.id),
        ),
      )
      .returning();
  });

  if (!updated) {
    return reply.code(404).send({ error: 'Ride request not found' });
  }

  return reply.send({
    request: rideRequestResponse(
      parsed.data.role
        ? { ...currentUser.user, rolePreference: parsed.data.role }
        : currentUser.user,
      updated,
    ),
  });
});

app.delete('/v1/ride-requests/:id', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  const params = request.params as { id?: string };
  if (
    !currentUser?.commuteRequest ||
    currentUser.commuteRequest.id !== params.id
  ) {
    return reply.code(404).send({ error: 'Ride request not found' });
  }

  const [cancelled] = await db
    .update(commuteRequests)
    .set({ active: false, updatedAt: new Date() })
    .where(
      and(
        eq(commuteRequests.id, currentUser.commuteRequest.id),
        eq(commuteRequests.userId, currentUser.user.id),
      ),
    )
    .returning();

  return reply.send({
    request: cancelled
      ? rideRequestResponse(currentUser.user, cancelled)
      : null,
  });
});

app.delete('/v1/trips/:tripId/rider', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  const params = request.params as { tripId?: string };
  if (!currentUser) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const membership = await db
    .select({
      memberId: tripMembers.id,
      role: tripMembers.role,
      status: trips.status,
    })
    .from(tripMembers)
    .innerJoin(trips, eq(trips.id, tripMembers.tripId))
    .where(
      and(
        eq(tripMembers.tripId, params.tripId ?? ''),
        eq(tripMembers.userId, currentUser.user.id),
      ),
    )
    .limit(1);

  const currentMembership = membership[0];
  if (!currentMembership) {
    return reply.code(404).send({ error: 'Trip membership not found' });
  }
  if (currentMembership.role !== 'rider') {
    return reply
      .code(403)
      .send({ error: 'Only riders can cancel this trip seat' });
  }
  if (
    currentMembership.status !== 'MATCHED' &&
    currentMembership.status !== 'CONFIRMED'
  ) {
    return reply
      .code(409)
      .send({ error: 'This trip can no longer be cancelled' });
  }

  await db
    .delete(tripMembers)
    .where(eq(tripMembers.id, currentMembership.memberId));

  return reply.send({
    tripId: params.tripId,
    status: currentMembership.status,
    rideContinues: true,
  });
});

app.get('/v1/notifications', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  if (!currentUser) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, currentUser.user.id))
    .orderBy(notifications.createdAt);

  return reply.send({ notifications: items });
});

app.get('/v1/trips/current', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  if (!currentUser) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const membership = await db
    .select({ trip: trips, member: tripMembers })
    .from(tripMembers)
    .innerJoin(trips, eq(trips.id, tripMembers.tripId))
    .where(eq(tripMembers.userId, currentUser.user.id))
    .orderBy(trips.tripDate)
    .limit(1);

  return reply.send({
    trip: membership[0]
      ? { ...membership[0].trip, member: membership[0].member }
      : null,
  });
});

app.post('/v1/trips/:tripId/confirm', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  const params = request.params as { tripId?: string };
  if (!currentUser) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const result = await db.transaction(async (tx) => {
    const [membership] = await tx
      .select({ trip: trips, member: tripMembers })
      .from(tripMembers)
      .innerJoin(trips, eq(trips.id, tripMembers.tripId))
      .where(
        and(
          eq(tripMembers.tripId, params.tripId ?? ''),
          eq(tripMembers.userId, currentUser.user.id),
        ),
      );

    if (!membership) {
      return { code: 404, error: 'Trip membership not found' } as const;
    }
    if (membership.trip.status !== 'MATCHED') {
      return {
        code: 409,
        error: 'This trip is not awaiting confirmation',
      } as const;
    }
    if (
      membership.trip.confirmationDeadline &&
      membership.trip.confirmationDeadline <= new Date()
    ) {
      return {
        code: 409,
        error: 'The confirmation window has closed',
      } as const;
    }

    await tx
      .update(tripMembers)
      .set({ confirmedAt: new Date() })
      .where(eq(tripMembers.id, membership.member.id));

    const members = await tx
      .select({ confirmedAt: tripMembers.confirmedAt })
      .from(tripMembers)
      .where(eq(tripMembers.tripId, membership.trip.id));
    const confirmed = members.every((member) => member.confirmedAt !== null);

    if (confirmed) {
      await tx
        .update(trips)
        .set({ status: 'CONFIRMED' })
        .where(eq(trips.id, membership.trip.id));
    }

    return {
      tripId: membership.trip.id,
      status: confirmed ? 'CONFIRMED' : 'MATCHED',
      confirmedMembers: members.filter((member) => member.confirmedAt !== null)
        .length,
      totalMembers: members.length,
    } as const;
  });

  if ('error' in result) {
    return reply.code(result.code ?? 409).send({ error: result.error });
  }
  return reply.send(result);
});

// Trip start: driver marks "started" or called by scheduler at scheduled pickup time
app.post('/v1/trips/:tripId/start', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  const params = request.params as { tripId?: string };
  if (!currentUser) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const result = await db.transaction(async (tx) => {
    const [membership] = await tx
      .select({ trip: trips, member: tripMembers })
      .from(tripMembers)
      .innerJoin(trips, eq(trips.id, tripMembers.tripId))
      .where(
        and(
          eq(tripMembers.tripId, params.tripId ?? ''),
          eq(tripMembers.userId, currentUser.user.id),
        ),
      );

    if (!membership) {
      return { code: 404, error: 'Trip membership not found' } as const;
    }
    if (membership.member.role !== 'driver') {
      return { code: 403, error: 'Only the driver can start the trip' } as const;
    }
    if (membership.trip.status !== 'CONFIRMED') {
      return { code: 409, error: 'Trip must be CONFIRMED before it can be started' } as const;
    }

    await tx
      .update(trips)
      .set({ status: 'IN_PROGRESS' })
      .where(eq(trips.id, membership.trip.id));

    return { tripId: membership.trip.id, status: 'IN_PROGRESS' } as const;
  });

  if ('error' in result) {
    return reply.code(result.code ?? 409).send({ error: result.error });
  }
  return reply.send(result);
});

// Trip complete: driver marks drop-off done or auto-triggered by geofence
app.post('/v1/trips/:tripId/complete', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const currentUser = await getCurrentUser(clerkIdentity.userId);
  const params = request.params as { tripId?: string };
  if (!currentUser) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const result = await db.transaction(async (tx) => {
    const [membership] = await tx
      .select({ trip: trips, member: tripMembers })
      .from(tripMembers)
      .innerJoin(trips, eq(trips.id, tripMembers.tripId))
      .where(
        and(
          eq(tripMembers.tripId, params.tripId ?? ''),
          eq(tripMembers.userId, currentUser.user.id),
        ),
      );

    if (!membership) {
      return { code: 404, error: 'Trip membership not found' } as const;
    }
    if (membership.member.role !== 'driver') {
      return { code: 403, error: 'Only the driver can complete the trip' } as const;
    }
    if (membership.trip.status !== 'IN_PROGRESS') {
      return { code: 409, error: 'Trip must be IN_PROGRESS before it can be completed' } as const;
    }

    await tx
      .update(trips)
      .set({ status: 'COMPLETED' })
      .where(eq(trips.id, membership.trip.id));

    return { tripId: membership.trip.id, status: 'COMPLETED' } as const;
  });

  if ('error' in result) {
    return reply.code(result.code ?? 409).send({ error: result.error });
  }
  return reply.send(result);
});


app.post('/v1/onboarding', async (request, reply) => {
  const clerkIdentity = (request as AuthenticatedRequest).clerkIdentity;
  if (!clerkIdentity) {
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
      .where(eq(users.clerkUserId, clerkIdentity.userId));
    const userValues = {
      clerkUserId: clerkIdentity.userId,
      name: data.name,
      profileImageUrl: clerkIdentity.imageUrl,
      gender: data.gender,
      homeZoneLabel: data.homeZoneLabel,
      homeZoneLatitude: data.homeZoneLatitude.toFixed(6),
      homeZoneLongitude: data.homeZoneLongitude.toFixed(6),
      officeBuilding: data.officeBuilding,
      officeEntryWindow: data.officeEntryWindow,
      rolePreference: data.rolePreference,
      clerkVerifiedAt: new Date(),
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

  return reply.code(201).send({
    complete: true,
    profile: saved,
    verification: verificationResponse(clerkIdentity),
  });
});

const port = Number(process.env.PORT ?? 4000);

app.listen({ host: '0.0.0.0', port }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
