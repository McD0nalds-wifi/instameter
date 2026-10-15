import * as v from 'valibot';

import {
  nonEmptyStringSchema,
  positiveIntegerSchema,
  positiveNumberSchema,
  slugSchema,
  urlSchema,
} from '@/shared/lib/schema';

export const FilmSpecSchema = v.object({
  id: slugSchema,
  name: nonEmptyStringSchema,
  iso: positiveIntegerSchema,
  frameSize: v.tuple([positiveNumberSchema, positiveNumberSchema]),
  latitudeStops: v.nullable(v.pipe(v.number(), v.minValue(0))),
  sourceUrl: v.optional(urlSchema),
});

export type FilmSpec = v.InferOutput<typeof FilmSpecSchema>;

export const FilmCatalogSchema = v.object({
  version: positiveIntegerSchema,
  films: v.pipe(v.array(FilmSpecSchema), v.minLength(1)),
});

export type FilmCatalog = v.InferOutput<typeof FilmCatalogSchema>;
