import 'dotenv/config';
import { and, eq } from 'drizzle-orm';

import {
  clusterPairs,
  clusters,
  commuteRequests,
  db,
  users,
  vehicles,
} from './index';

const corridors = [
  {
    residential: 'Baner - Balewadi',
    workspace: 'Hinjawadi Rajiv Gandhi Infotech Park',
    homeZone: 'Baner',
    latitude: 18.559,
    longitude: 73.779,
    office: 'Hinjawadi Phase 1 Campus',
  },
  {
    residential: 'Viman Nagar - Kalyani Nagar',
    workspace: 'Kharadi EON IT Park',
    homeZone: 'Viman Nagar',
    latitude: 18.567,
    longitude: 73.914,
    office: 'EON Free Zone',
  },
  {
    residential: 'Hadapsar - Magarpatta',
    workspace: 'Magarpatta City',
    homeZone: 'Hadapsar',
    latitude: 18.508,
    longitude: 73.926,
    office: 'Cybercity Magarpatta',
  },
] as const;

const names = [
  'Aarav Kulkarni',
  'Ananya Deshpande',
  'Ishaan Joshi',
  'Meera Patil',
  'Rohan Bhide',
  'Saanvi Shah',
  'Aditya Jagtap',
  'Kiara Nair',
  'Vedant More',
  'Ira Gokhale',
  'Kabir Pawar',
  'Tanvi Apte',
  'Arjun Sane',
  'Aditi Kamat',
  'Dhruv Naik',
  'Mihika Salunkhe',
  'Omkar Shinde',
  'Prisha Tare',
  'Yash Wagh',
  'Nandini Bapat',
  'Vihaan Kunte',
  'Riya Chavan',
  'Samar Limaye',
  'Anvi Ranade',
  'Atharva Dhumal',
  'Neha Vaidya',
  'Manav Karkhanis',
  'Sai Joshi',
  'Reyansh Purohit',
  'Ishita Oak',
  'Kunal Bhosale',
  'Manya Pendse',
  'Nikhil Date',
  'Aarohi Kelkar',
  'Shreyas Dandekar',
  'Kavya Bhave',
] as const;

const vehicleModels = [
  'Maruti Suzuki Brezza',
  'Hyundai Creta',
  'Tata Nexon',
  'Honda City',
] as const;
const genders = ['female', 'male', 'non_binary'] as const;

async function getOrCreateCluster(name: string, kind: string) {
  const [existing] = await db
    .select()
    .from(clusters)
    .where(and(eq(clusters.name, name), eq(clusters.kind, kind)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db.insert(clusters).values({ name, kind }).returning();
  if (!created) {
    throw new Error(`Unable to create ${kind} cluster: ${name}`);
  }

  return created;
}

async function ensureClusterPair(residentialClusterId: string, workspaceClusterId: string) {
  const [existing] = await db
    .select()
    .from(clusterPairs)
    .where(
      and(
        eq(clusterPairs.residentialClusterId, residentialClusterId),
        eq(clusterPairs.workspaceClusterId, workspaceClusterId),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(clusterPairs).values({
      residentialClusterId,
      workspaceClusterId,
      active: true,
    });
  } else if (!existing.active) {
    await db
      .update(clusterPairs)
      .set({ active: true })
      .where(eq(clusterPairs.id, existing.id));
  }
}

const clusterIds = [];
for (const corridor of corridors) {
  const residentialCluster = await getOrCreateCluster(
    corridor.residential,
    'residential',
  );
  const workspaceCluster = await getOrCreateCluster(
    corridor.workspace,
    'workspace',
  );
  await ensureClusterPair(residentialCluster.id, workspaceCluster.id);
  clusterIds.push({
    residentialClusterId: residentialCluster.id,
    workspaceClusterId: workspaceCluster.id,
  });
}

for (let index = 0; index < names.length; index += 1) {
  const corridorIndex = Math.floor(index / 12);
  const memberIndex = index % 12;
  const corridor = corridors[corridorIndex];
  const pair = clusterIds[corridorIndex];
  if (!corridor || !pair) {
    throw new Error(`Missing corridor for dummy user ${index + 1}`);
  }

  const isDriver = memberIndex % 4 === 0;
  const latitudeOffset = ((memberIndex % 4) - 1.5) * 0.0011;
  const longitudeOffset = (Math.floor(memberIndex / 4) - 1) * 0.0012;
  const name = names[index];
  const gender = genders[index % genders.length];
  const vehicleModel = vehicleModels[index % vehicleModels.length];
  if (!name || !gender || !vehicleModel) {
    throw new Error(`Missing fixture data for dummy user ${index + 1}`);
  }

  const userValues = {
    clerkUserId: `dummy-pune-${String(index + 1).padStart(2, '0')}`,
    name,
    gender,
    homeZoneLabel: corridor.homeZone,
    homeZoneLatitude: (corridor.latitude + latitudeOffset).toFixed(6),
    homeZoneLongitude: (corridor.longitude + longitudeOffset).toFixed(6),
    officeBuilding: corridor.office,
    officeEntryWindow: '08:30 - 09:00',
    rolePreference: isDriver ? ('driver' as const) : ('both' as const),
    clerkVerifiedAt: new Date(),
    profileComplete: true,
    updatedAt: new Date(),
  };

  const [user] = await db
    .insert(users)
    .values(userValues)
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: userValues,
    })
    .returning();

  if (!user) {
    throw new Error(`Unable to seed dummy user ${userValues.name}`);
  }

  await db
    .insert(vehicles)
    .values({
      userId: user.id,
      model: vehicleModel,
      plateNumber: `MH12${String(1000 + index)}`,
      seatsAvailable: isDriver ? 4 : 0,
    })
    .onConflictDoUpdate({
      target: vehicles.userId,
      set: {
        model: vehicleModel,
        plateNumber: `MH12${String(1000 + index)}`,
        seatsAvailable: isDriver ? 4 : 0,
      },
    });

  await db
    .insert(commuteRequests)
    .values({
      userId: user.id,
      residentialClusterId: pair.residentialClusterId,
      workspaceClusterId: pair.workspaceClusterId,
      commuteDays: 'monday,tuesday,wednesday,thursday,friday',
      active: true,
    })
    .onConflictDoUpdate({
      target: commuteRequests.userId,
      set: {
        residentialClusterId: pair.residentialClusterId,
        workspaceClusterId: pair.workspaceClusterId,
        commuteDays: 'monday,tuesday,wednesday,thursday,friday',
        active: true,
        updatedAt: new Date(),
      },
    });
}

const activePair = await db
  .select()
  .from(clusterPairs)
  .where(eq(clusterPairs.active, true));
console.log(
  `Nexar seed ready: ${names.length} dummy Pune users, ${activePair.length} active cluster pair(s).`,
);
