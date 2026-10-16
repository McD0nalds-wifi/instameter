import type { ExposureSettings } from '@/shared/lib/exposure';

import * as v from 'valibot';

import { sceneEv100 } from '@/shared/lib/exposure';
import { positiveNumberSchema, slugSchema } from '@/shared/lib/schema';

export const MeasurementSchema = v.object({
  ev100: v.number(),
  source: v.picklist(['exif', 'scene']),
  confidence: v.picklist(['high', 'low']),
  exif: v.optional(
    v.object({
      exposureTime: positiveNumberSchema,
      fNumber: positiveNumberSchema,
      iso: positiveNumberSchema,
      exposureBias: v.optional(v.number()),
    }),
  ),
  sceneId: v.optional(slugSchema),
  at: v.number(),
});

export type Measurement = v.InferOutput<typeof MeasurementSchema>;

export const createExifMeasurement = (
  exposure: ExposureSettings,
  deviceCorrection: number,
  at: number = Date.now(),
): Measurement => ({
  ev100: sceneEv100(exposure, deviceCorrection),
  source: 'exif',
  confidence: 'high',
  exif: exposure,
  at,
});
