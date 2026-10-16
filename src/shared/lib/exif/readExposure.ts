import type { ExposureSettings } from '../exposure';

import exifr from 'exifr/dist/lite.esm.mjs';
import * as v from 'valibot';

import { positiveNumberSchema } from '../schema';

export type ExposureField = 'exposureTime' | 'fNumber' | 'iso';

export type ExifReadResult =
  | { status: 'ok'; exposure: ExposureSettings }
  | { status: 'no-exif' }
  | { status: 'missing-fields'; missing: ExposureField[] }
  | { status: 'unreadable' };

const parseOptions = {
  ifd1: false,
  gps: false,
  interop: false,
  xmp: false,
  translateValues: false,
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readPositive = (value: unknown): number | undefined =>
  v.is(positiveNumberSchema, value) ? value : undefined;

const readIso = (value: unknown): number | undefined =>
  Array.isArray(value) ? readPositive(value[0]) : readPositive(value);

const readBias = (value: unknown): number => (typeof value === 'number' ? value : 0);

export const exposureFromTags = (tags: unknown): ExifReadResult => {
  if (!isRecord(tags)) {
    return { status: 'no-exif' };
  }
  const fields = {
    exposureTime: readPositive(tags.ExposureTime),
    fNumber: readPositive(tags.FNumber),
    iso: readIso(tags.ISO),
  };
  const missing = (Object.keys(fields) as ExposureField[]).filter(
    (field) => fields[field] === undefined,
  );

  if (missing.length === Object.keys(fields).length) {
    return { status: 'no-exif' };
  }
  const { exposureTime, fNumber, iso } = fields;

  if (exposureTime === undefined || fNumber === undefined || iso === undefined) {
    return { status: 'missing-fields', missing };
  }
  return {
    status: 'ok',
    exposure: { exposureTime, fNumber, iso, exposureBias: readBias(tags.ExposureCompensation) },
  };
};

export const readExposure = async (file: Blob): Promise<ExifReadResult> => {
  try {
    return exposureFromTags(await exifr.parse(file, parseOptions));
  } catch (error) {
    console.warn('[exif] не удалось разобрать файл', error);
    return { status: 'unreadable' };
  }
};
