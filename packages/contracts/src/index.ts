import { z } from 'zod';

export const tripStatusSchema = z.enum([
  'REQUESTED',
  'MATCHED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export type TripStatus = z.infer<typeof tripStatusSchema>;

export const commuteDaySchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
]);

export const rideRoleSchema = z.enum(['driver', 'passenger']);

export const rideRequestSchema = z.object({
  commuteDays: z.array(commuteDaySchema).min(1),
});

export const rideRequestUpdateSchema = rideRequestSchema.partial().extend({
  role: rideRoleSchema.optional(),
  active: z.boolean().optional(),
});

export type RideRole = z.infer<typeof rideRoleSchema>;
export type RideRequestInput = z.infer<typeof rideRequestSchema>;
