export const REQUIRED_GROUP_SIZE = 4;
export const MAX_OFFICE_WALK_METERS = 400;
export const MAX_HOME_DISTANCE_METERS = 5000;

export type MatchCandidate = {
  userId: string;
  name: string;
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

function entryBucket(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return value;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return `${String(hour).padStart(2, '0')}:${minute < 30 ? '00' : '30'}`;
}

function distanceMeters(first: MatchCandidate, second: MatchCandidate) {
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
  const remaining = new Set(candidates.map((candidate) => candidate.userId));

  for (const candidate of candidates) {
    if (!remaining.has(candidate.userId)) {
      continue;
    }

    for (const commuteDay of candidate.commuteDays) {
      const bucket = entryBucket(candidate.officeEntryWindow);
      const compatible = candidates.filter(
        (possible) =>
          remaining.has(possible.userId) &&
          possible.commuteDays.includes(commuteDay) &&
          possible.residentialClusterId === candidate.residentialClusterId &&
          possible.workspaceClusterId === candidate.workspaceClusterId &&
          possible.officeBuilding === candidate.officeBuilding &&
          entryBucket(possible.officeEntryWindow) === bucket &&
          distanceMeters(candidate, possible) <= MAX_HOME_DISTANCE_METERS,
      );

      if (compatible.length < REQUIRED_GROUP_SIZE) {
        continue;
      }

      const driver = compatible.find(
        (possible) => possible.seatsAvailable >= 3,
      );
      if (!driver) {
        continue;
      }

      const members = compatible.slice(0, REQUIRED_GROUP_SIZE);
      if (!members.some((member) => member.userId === driver.userId)) {
        members[REQUIRED_GROUP_SIZE - 1] = driver;
      }

      const memberIds = members.map((member) => member.userId);
      groups.push({
        driverId: driver.userId,
        riderIds: memberIds.filter((userId) => userId !== driver.userId),
        memberIds,
        residentialClusterId: candidate.residentialClusterId,
        workspaceClusterId: candidate.workspaceClusterId,
        officeBuilding: candidate.officeBuilding,
        commuteDay,
        entryBucket: bucket,
      });
      memberIds.forEach((userId) => remaining.delete(userId));
      break;
    }
  }

  return groups;
}
