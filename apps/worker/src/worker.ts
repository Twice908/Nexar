import 'dotenv/config';

import { Queue, Worker } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import IORedis from 'ioredis';

import {
  commuteRequests,
  db,
  notifications,
  trips,
  tripMembers,
  users,
  vehicles,
} from '@nexar/db';
import { createMatchGroups, type MatchCandidate } from '@nexar/matching';

function nextWeekday() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return date;
}

function weekdayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function dateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function confirmationDeadline(tripDate: Date) {
  return new Date(`${dateValue(tripDate)}T21:30:00+05:30`);
}

export async function runNightlyMatching(tripDate = nextWeekday()) {
  const candidates = await db
    .select({ user: users, vehicle: vehicles, commuteRequest: commuteRequests })
    .from(users)
    .innerJoin(vehicles, eq(vehicles.userId, users.id))
    .innerJoin(commuteRequests, eq(commuteRequests.userId, users.id))
    .where(
      and(eq(users.profileComplete, true), eq(commuteRequests.active, true)),
    );

  const dayName = weekdayName(tripDate);
  const matchCandidates: MatchCandidate[] = candidates
    .filter(({ commuteRequest }) =>
      commuteRequest.commuteDays.split(',').includes(dayName),
    )
    .map(({ user, vehicle, commuteRequest }) => ({
      userId: user.id,
      name: user.name,
      role: user.rolePreference === 'passenger' ? 'passenger' : 'driver',
      residentialClusterId: commuteRequest.residentialClusterId,
      workspaceClusterId: commuteRequest.workspaceClusterId,
      officeBuilding: user.officeBuilding,
      officeEntryWindow: user.officeEntryWindow,
      homeLatitude: Number(user.homeZoneLatitude),
      homeLongitude: Number(user.homeZoneLongitude),
      seatsAvailable: vehicle.seatsAvailable,
      commuteDays: commuteRequest.commuteDays.split(','),
    }));
  const matching = createMatchGroups(matchCandidates);
  const matchedUserIds = new Set(matching.flatMap((group) => group.memberIds));

  await db.transaction(async (tx) => {
    for (const group of matching) {
      const [trip] = await tx
        .insert(trips)
        .values({
          tripDate: dateValue(tripDate),
          residentialClusterId: group.residentialClusterId,
          workspaceClusterId: group.workspaceClusterId,
          officeBuilding: group.officeBuilding,
          driverId: group.driverId,
          entryBucket: group.entryBucket,
          confirmationDeadline: confirmationDeadline(tripDate),
          status: 'MATCHED',
        })
        .returning({ id: trips.id });

      if (!trip) {
        throw new Error('Unable to persist matched trip');
      }

      await tx.insert(tripMembers).values(
        group.memberIds.map((userId) => ({
          tripId: trip.id,
          userId,
          role:
            userId === group.driverId
              ? ('driver' as const)
              : ('rider' as const),
          pickupOrder:
            userId === group.driverId
              ? null
              : group.riderIds.indexOf(userId) + 1,
        })),
      );

      await tx.insert(notifications).values(
        group.memberIds.map((userId) => ({
          userId,
          tripId: trip.id,
          type: 'TRIP_CONFIRMATION',
          title: "Confirm tomorrow's commute",
          message:
            'Your matched commute is ready to confirm. Pickup point: to be assigned. ' +
            'Pickup order: see your trip. Drop point: to be assigned. Cost split: pending.',
        })),
      );
    }
  });

  return {
    matchedGroups: matching.length,
    unmatchedUserIds: matchCandidates
      .filter((candidate) => !matchedUserIds.has(candidate.userId))
      .map((candidate) => candidate.userId),
  };
}

const MATCHING_QUEUE_NAME = 'nexar-matching';
const MATCHING_SCHEDULER_ID = 'nightly-tomorrow-matching';
const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:16379';
const matchingCron = process.env.MATCHING_CRON ?? '0 20 * * 1-5';
const matchingTimezone = process.env.MATCHING_TIMEZONE ?? 'Asia/Kolkata';

function createRedisConnection() {
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

export async function scheduleNightlyMatching() {
  const queue = new Queue(MATCHING_QUEUE_NAME, {
    connection: createRedisConnection(),
  });
  await queue.upsertJobScheduler(
    MATCHING_SCHEDULER_ID,
    { pattern: matchingCron, tz: matchingTimezone },
    { name: 'match-tomorrow' },
  );
  await queue.close();
}

if (process.env.NODE_ENV !== 'test') {
  const worker = new Worker(
    MATCHING_QUEUE_NAME,
    async () => {
      const result = await runNightlyMatching();
      console.log(`Nexar matching complete: ${result.matchedGroups} group(s).`);
      return result;
    },
    { connection: createRedisConnection() },
  );

  void scheduleNightlyMatching().then(() => {
    console.log(
      `Nightly matching scheduled for ${matchingCron} (${matchingTimezone}).`,
    );
  });

  worker.on('failed', (job, error) => {
    console.error(`Matching job ${job?.id ?? 'unknown'} failed`, error);
  });
}
