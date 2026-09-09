import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', [
  'female',
  'male',
  'non_binary',
  'prefer_not_to_say',
]);
export const rolePreferenceEnum = pgEnum('role_preference', [
  'driver',
  'passenger',
  'car_owner',
  'both',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  name: text('name').notNull(),
  gender: genderEnum('gender').notNull(),
  homeZoneLabel: text('home_zone_label').notNull(),
  homeZoneLatitude: numeric('home_zone_latitude', {
    precision: 9,
    scale: 6,
  }).notNull(),
  homeZoneLongitude: numeric('home_zone_longitude', {
    precision: 9,
    scale: 6,
  }).notNull(),
  officeBuilding: text('office_building').notNull(),
  officeEntryWindow: text('office_entry_window').notNull(),
  rolePreference: rolePreferenceEnum('role_preference')
    .notNull()
    .default('both'),
  profileImageUrl: text('profile_image_url'),
  clerkVerifiedAt: timestamp('clerk_verified_at', { withTimezone: true }),
  profileComplete: boolean('profile_complete').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  model: text('model').notNull(),
  plateNumber: text('plate_number').notNull(),
  seatsAvailable: integer('seats_available').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const commuteRequests = pgTable('commute_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  residentialClusterId: uuid('residential_cluster_id').notNull(),
  workspaceClusterId: uuid('workspace_cluster_id').notNull(),
  commuteDays: text('commute_days').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clusters = pgTable('clusters', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clusterPairs = pgTable('cluster_pairs', {
  id: uuid('id').defaultRandom().primaryKey(),
  residentialClusterId: uuid('residential_cluster_id')
    .notNull()
    .references(() => clusters.id),
  workspaceClusterId: uuid('workspace_cluster_id')
    .notNull()
    .references(() => clusters.id),
  active: boolean('active').notNull().default(true),
});

export const tripStatusEnum = pgEnum('trip_status', [
  'REQUESTED',
  'MATCHED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const tripMemberRoleEnum = pgEnum('trip_member_role', [
  'driver',
  'rider',
]);

export const trips = pgTable('trips', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripDate: date('trip_date').notNull(),
  residentialClusterId: uuid('residential_cluster_id')
    .notNull()
    .references(() => clusters.id),
  workspaceClusterId: uuid('workspace_cluster_id')
    .notNull()
    .references(() => clusters.id),
  officeBuilding: text('office_building').notNull(),
  driverId: uuid('driver_id')
    .notNull()
    .references(() => users.id),
  entryBucket: text('entry_bucket').notNull(),
  pickupPointLabel: text('pickup_point_label'),
  dropPointLabel: text('drop_point_label'),
  status: tripStatusEnum('status').notNull().default('MATCHED'),
  costPerHead: numeric('cost_per_head', { precision: 10, scale: 2 }),
  confirmationDeadline: timestamp('confirmation_deadline', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tripMembers = pgTable('trip_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  role: tripMemberRoleEnum('role').notNull(),
  pickupOrder: integer('pickup_order'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
