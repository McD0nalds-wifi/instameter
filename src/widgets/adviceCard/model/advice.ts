import type { CameraSpec } from '@/entities/camera';
import type { Measurement } from '@/entities/measurement';
import type { UserCamera } from '@/entities/userCamera';
import type { Recommendation } from '@/shared/lib/exposure';

import { findFilm } from '@/entities/film';
import { resolveCameraSpec } from '@/entities/userCamera';
import {
  DEFAULT_RECOMMEND_OPTIONS,
  programShutterRange,
  recommend,
  significantMeteringBias,
} from '@/shared/lib/exposure';

export type AdviceState =
  | { kind: 'no-measurement' }
  | { kind: 'no-camera' }
  | { kind: 'unsupported-camera'; cameraName: string }
  | {
      kind: 'ready';
      cameraName: string;
      filmName: string;
      recommendation: Recommendation;
      filterThread?: number;
      flashControllable: boolean;
      adviceMode?: 'auto' | 'aperture-priority';
      flashRange?: { min: number; max: number | null };
      reminders?: NonNullable<CameraSpec['adviceReminders']>;
      hasProgramAperture: boolean;
      meteringBias: number;
      compensationLabels?: NonNullable<CameraSpec['compensationLabels']>;
    };

export const buildAdvice = (
  measurement: Measurement | null,
  camera: UserCamera | null,
): AdviceState => {
  if (!camera) {
    return { kind: 'no-camera' };
  }
  if (!measurement) {
    return { kind: 'no-measurement' };
  }
  const spec = resolveCameraSpec(camera);
  const film = findFilm(camera.loadedFilmId);

  if (!spec || !film || !programShutterRange(spec.shutter)) {
    return { kind: 'unsupported-camera', cameraName: camera.nickname };
  }
  return {
    kind: 'ready',
    cameraName: camera.nickname,
    filmName: film.name,
    recommendation: recommend(measurement.ev100, spec, film, {
      ...DEFAULT_RECOMMEND_OPTIONS,
      meteringBias: measurement.meteringBias,
    }),
    meteringBias: significantMeteringBias(measurement.meteringBias),
    filterThread: spec.filterThread,
    flashControllable: spec.flash.canDisable,
    adviceMode: spec.adviceMode,
    flashRange: spec.flash.range,
    reminders: spec.adviceReminders,
    hasProgramAperture: spec.programApertures !== undefined,
    compensationLabels: spec.compensationLabels,
  };
};
