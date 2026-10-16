import * as v from 'valibot';

import {
  nonEmptyStringSchema,
  positiveIntegerSchema,
  positiveNumberSchema,
  slugSchema,
  urlSchema,
} from '@/shared/lib/schema';

const ProgramShutterSchema = v.pipe(
  v.object({
    kind: v.literal('program'),
    fastest: positiveNumberSchema,
    slowest: positiveNumberSchema,
  }),
  v.check(
    ({ fastest, slowest }) => fastest < slowest,
    'Самая короткая выдержка должна быть меньше самой длинной',
  ),
);

const FixedShutterSchema = v.object({
  kind: v.literal('fixed'),
  values: v.pipe(v.array(positiveNumberSchema), v.minLength(1)),
});

const BulbShutterSchema = v.object({
  kind: v.literal('bulb'),
  maxSeconds: v.optional(positiveNumberSchema),
});

export const ShutterRangeSchema = v.variant('kind', [
  ProgramShutterSchema,
  FixedShutterSchema,
  BulbShutterSchema,
]);

export type ShutterRange = v.InferOutput<typeof ShutterRangeSchema>;

const distanceRangeEntries = {
  min: positiveNumberSchema,
  max: v.nullable(positiveNumberSchema),
};

type DistanceBounds = {
  min: number;
  max: number | null;
};

const checkDistanceOrder = <TInput extends DistanceBounds>() =>
  v.check<TInput, string>(
    ({ min, max }) => max === null || min < max,
    'Ближняя граница должна быть меньше дальней',
  );

const DistanceRangeSchema = v.pipe(v.object(distanceRangeEntries), checkDistanceOrder());

export const FlashSpecSchema = v.object({
  canDisable: v.boolean(),
  guideNumber: v.optional(positiveNumberSchema),
  guideNumberIso: v.optional(positiveIntegerSchema),
  range: v.optional(DistanceRangeSchema),
});

export type FlashSpec = v.InferOutput<typeof FlashSpecSchema>;

export const FocusZoneSchema = v.pipe(
  v.object({
    label: nonEmptyStringSchema,
    ...distanceRangeEntries,
  }),
  checkDistanceOrder(),
);

export type FocusZone = v.InferOutput<typeof FocusZoneSchema>;

export const MeteringRangeSchema = v.pipe(
  v.object({
    minLv: v.number(),
    maxLv: v.number(),
    iso: positiveIntegerSchema,
  }),
  v.check(({ minLv, maxLv }) => minLv < maxLv, 'Нижняя граница замера должна быть меньше верхней'),
);

export type MeteringRange = v.InferOutput<typeof MeteringRangeSchema>;

export const CameraSpecSchema = v.pipe(
  v.object({
    id: slugSchema,
    brand: nonEmptyStringSchema,
    model: nonEmptyStringSchema,
    filmIds: v.pipe(v.array(slugSchema), v.minLength(1)),
    focalLength: positiveNumberSchema,
    apertures: v.array(positiveNumberSchema),
    effectiveAperture: v.optional(positiveNumberSchema),
    shutter: v.pipe(v.array(ShutterRangeSchema), v.minLength(1)),
    exposureCompensation: v.array(v.number()),
    flash: FlashSpecSchema,
    focusZones: v.optional(v.array(FocusZoneSchema)),
    meteringRange: v.optional(MeteringRangeSchema),
    filterThread: v.optional(positiveNumberSchema),
    notes: v.optional(nonEmptyStringSchema),
    sourceUrl: v.optional(urlSchema),
  }),
  v.check(
    ({ apertures, effectiveAperture }) => apertures.length > 0 || effectiveAperture !== undefined,
    'У камеры без выбора диафрагмы должна быть задана effectiveAperture',
  ),
);

export type CameraSpec = v.InferOutput<typeof CameraSpecSchema>;

export const CameraCatalogSchema = v.object({
  version: positiveIntegerSchema,
  cameras: v.pipe(v.array(CameraSpecSchema), v.minLength(1)),
});

export type CameraCatalog = v.InferOutput<typeof CameraCatalogSchema>;
