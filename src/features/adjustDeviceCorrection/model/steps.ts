import { DEVICE_CORRECTION_LIMIT } from '@/entities/preference';

export const CORRECTION_STEP = 1 / 3;

export const snapToThirds = (value: number): number => Math.round(value * 3) / 3;

export const stepCorrection = (current: number, direction: 1 | -1): number => {
  const next = snapToThirds(current + direction * CORRECTION_STEP);
  return Math.min(Math.max(next, -DEVICE_CORRECTION_LIMIT), DEVICE_CORRECTION_LIMIT);
};

export const canStep = (current: number, direction: 1 | -1): boolean =>
  direction > 0
    ? snapToThirds(current) < DEVICE_CORRECTION_LIMIT
    : snapToThirds(current) > -DEVICE_CORRECTION_LIMIT;
