import { describe, expect, it } from 'vitest';

import { createMatchGroups, type MatchCandidate } from './index';

const candidates: MatchCandidate[] = [1, 2, 3, 4].map((number) => ({
  userId: `user-${number}`,
  name: `User ${number}`,
  residentialClusterId: 'residential-a',
  workspaceClusterId: 'workspace-a',
  officeBuilding: 'Nexar Campus',
  officeEntryWindow: '08:30 - 09:00',
  homeLatitude: 12.9716 + number / 10000,
  homeLongitude: 77.5946 + number / 10000,
  seatsAvailable: number === 1 ? 3 : 0,
  commuteDays: ['monday'],
}));

describe('createMatchGroups', () => {
  it('creates exactly four members with one eligible car owner', () => {
    const [group] = createMatchGroups(candidates);

    expect(group?.memberIds).toHaveLength(4);
    expect(group?.driverId).toBe('user-1');
    expect(group?.riderIds).toHaveLength(3);
  });

  it('does not form a group without a car owner', () => {
    expect(
      createMatchGroups(
        candidates.map((candidate) => ({ ...candidate, seatsAvailable: 0 })),
      ),
    ).toHaveLength(0);
  });
});
