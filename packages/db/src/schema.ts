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
    .default('car_owner'),
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
