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