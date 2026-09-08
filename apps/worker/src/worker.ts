import 'dotenv/config';

import { and, eq } from 'drizzle-orm';

import {
  commuteRequests,
  db,
  trips,
  tripMembers,
  users,
  vehicles,
} from '@nexar/db';
import { createMatchGroups, type MatchCandidate } from '@nexar/matching';

function nextWeekday() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

function weekdayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
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
    }
  });

  return {
    matchedGroups: matching.length,
    unmatchedUserIds: matchCandidates
      .filter((candidate) => !matchedUserIds.has(candidate.userId))
      .map((candidate) => candidate.userId),
  };
}

if (process.env.NODE_ENV !== 'test') {
  void runNightlyMatching().then((result) => {
    console.log(`Nexar matching complete: ${result.matchedGroups} group(s).`);
  });
}
