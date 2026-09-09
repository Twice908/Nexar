import { describe, expect, it } from 'vitest';

import { createMatchGroups, type MatchCandidate } from './index';

const candidates: MatchCandidate[] = [1, 2, 3, 4].map((number) => ({
  userId: `user-${number}`,
  name: `User ${number}`,
  role: number === 1 ? 'driver' : 'passenger',
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

  it('always puts the driver first and orders riders by proximity', () => {
    const [group] = createMatchGroups([
      { ...candidates[3]!, userId: 'far-rider', homeLatitude: 13.01 },
      { ...candidates[0]!, userId: 'driver', homeLatitude: 12.9716 },
      { ...candidates[2]!, userId: 'near-rider', homeLatitude: 12.9717 },
      { ...candidates[1]!, userId: 'middle-rider', homeLatitude: 12.972 },
    ]);

    expect(group?.driverId).toBe('driver');
    expect(group?.memberIds).toEqual([
      'driver',
      'near-rider',
      'middle-rider',
      'far-rider',
    ]);
  });
});
