export const REQUIRED_GROUP_SIZE = 4;
export const MAX_OFFICE_WALK_METERS = 400;
export const MAX_HOME_DISTANCE_METERS = 5000;

export type MatchCandidate = {
  userId: string;
  name: string;
  role: 'driver' | 'passenger';
  residentialClusterId: string;
  workspaceClusterId: string;
  officeBuilding: string;
  officeEntryWindow: string;
  homeLatitude: number;
  homeLongitude: number;
  seatsAvailable: number;
  commuteDays: string[];
};

export type MatchGroup = {
  driverId: string;
  riderIds: string[];
  memberIds: string[];
  residentialClusterId: string;
  workspaceClusterId: string;
  officeBuilding: string;
  commuteDay: string;
  entryBucket: string;
};

export function entryBucket(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return value;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return `${String(hour).padStart(2, '0')}:${minute < 30 ? '00' : '30'}`;
}

export function distanceMeters(first: MatchCandidate, second: MatchCandidate) {
  const earthRadius = 6371000;
  const latitudeDelta =
    ((second.homeLatitude - first.homeLatitude) * Math.PI) / 180;
  const longitudeDelta =
    ((second.homeLongitude - first.homeLongitude) * Math.PI) / 180;
  const latitude = (first.homeLatitude * Math.PI) / 180;
  const secondLatitude = (second.homeLatitude * Math.PI) / 180;
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function createMatchGroups(candidates: MatchCandidate[]): MatchGroup[] {
  const groups: MatchGroup[] = [];
  const remainingRiders = new Set(
    candidates
      .filter((candidate) => candidate.role === 'passenger')
      .map((candidate) => candidate.userId),
  );
  const drivers = candidates.filter(
    (candidate) => candidate.role === 'driver' && candidate.seatsAvailable >= 3,
  );

  for (const driver of drivers) {
    for (const commuteDay of driver.commuteDays) {
      const bucket = entryBucket(driver.officeEntryWindow);
      const riders = candidates
        .filter(
          (possible) =>
            remainingRiders.has(possible.userId) &&
            possible.commuteDays.includes(commuteDay) &&
            possible.residentialClusterId === driver.residentialClusterId &&
            possible.workspaceClusterId === driver.workspaceClusterId &&
            possible.officeBuilding === driver.officeBuilding &&
            entryBucket(possible.officeEntryWindow) === bucket &&
            distanceMeters(driver, possible) <= MAX_HOME_DISTANCE_METERS,
        )
        .sort(
          (first, second) =>
            distanceMeters(driver, first) - distanceMeters(driver, second),
        )
        .slice(0, REQUIRED_GROUP_SIZE - 1);

      if (riders.length < REQUIRED_GROUP_SIZE - 1) {
        continue;
      }

      const memberIds = [driver.userId, ...riders.map((rider) => rider.userId)];
      groups.push({
        driverId: driver.userId,
        riderIds: riders.map((rider) => rider.userId),
        memberIds,
        residentialClusterId: driver.residentialClusterId,
        workspaceClusterId: driver.workspaceClusterId,
        officeBuilding: driver.officeBuilding,
        commuteDay,
        entryBucket: bucket,
      });
      riders.forEach((rider) => remainingRiders.delete(rider.userId));
      break;
    }
  }

  return groups;
}
