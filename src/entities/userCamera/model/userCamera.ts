import type { CameraSpec } from '@/entities/camera/@x/userCamera';

import * as v from 'valibot';

import { CameraSpecSchema, findCameraSpec } from '@/entities/camera/@x/userCamera';
import { nonEmptyStringSchema, slugSchema } from '@/shared/lib/schema';

export const UserCameraSchema = v.pipe(
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    specId: v.nullable(slugSchema),
    customSpec: v.optional(CameraSpecSchema),
    nickname: nonEmptyStringSchema,
    loadedFilmId: slugSchema,
    createdAt: v.number(),
  }),
  v.check(
    ({ specId, customSpec }) => specId !== null || customSpec !== undefined,
    'Камера должна ссылаться на каталог или хранить свою спеку',
  ),
);

export type UserCamera = v.InferOutput<typeof UserCameraSchema>;

export const ActiveCameraIdSchema = v.nullable(v.pipe(v.string(), v.uuid()));

export const createUserCameraFromSpec = (
  spec: CameraSpec,
  createdAt: number = Date.now(),
  id: string = crypto.randomUUID(),
): UserCamera => ({
  id,
  specId: spec.id,
  nickname: spec.model,
  loadedFilmId: spec.filmIds[0]!,
  createdAt,
});

export const resolveCameraSpec = ({ customSpec, specId }: UserCamera): CameraSpec | undefined =>
  customSpec ?? (specId === null ? undefined : findCameraSpec(specId));
