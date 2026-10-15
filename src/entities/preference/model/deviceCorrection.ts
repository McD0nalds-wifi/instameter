import * as v from 'valibot';

export const DEVICE_CORRECTION_LIMIT = 2;

export const DeviceCorrectionSchema = v.pipe(
  v.number(),
  v.minValue(-DEVICE_CORRECTION_LIMIT),
  v.maxValue(DEVICE_CORRECTION_LIMIT),
);

export const DEFAULT_DEVICE_CORRECTION = 0;
