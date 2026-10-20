import { lvToEv100 } from './ev';

export type ShutterMode =
  | { kind: 'program'; fastest: number; slowest: number }
  | { kind: 'fixed'; values: readonly number[] }
  | { kind: 'bulb'; maxSeconds?: number };

export type ExposureCamera = {
  focalLength: number;
  apertures: readonly number[];
  programApertures?: readonly number[];
  effectiveAperture?: number;
  shutter: readonly ShutterMode[];
  exposureCompensation: readonly number[];
  flash: { canDisable: boolean; offOnlyAtZeroCompensation?: boolean };
  meteringRange?: { minLv: number; maxLv: number; iso: number };
};

export type ExposureFilm = {
  iso: number;
  frameSize: readonly [number, number];
  latitudeStops: number | null;
};

export type RecommendOptions = {
  defaultLatitudeStops: number;
  handheld: boolean;
  meteringBias?: number;
};

export const DEFAULT_RECOMMEND_OPTIONS: RecommendOptions = {
  defaultLatitudeStops: 1,
  handheld: true,
};

export type ExposureWarning =
  | { kind: 'shutter-ceiling'; stops: number }
  | { kind: 'shutter-floor'; stops: number }
  | { kind: 'beyond-latitude'; stops: number }
  | { kind: 'blur-risk'; stops: number }
  | { kind: 'outside-metering-range'; stops: number };

export type Rationale =
  'exact' | 'least-overexposure' | 'least-underexposure' | 'least-blur' | 'fixed-settings';

export type FlashAdvice = 'on' | 'off' | 'camera-decides';

export type Recommendation = {
  aperture: number | null;
  exposureCompensation: number | null;
  flash: FlashAdvice;
  predictedAperture: number;
  predictedShutter: number;
  residualError: number;
  blurStops: number;
  warnings: ExposureWarning[];
  rationale: Rationale;
};

export type ShutterRange = {
  fastest: number;
  slowest: number;
};

export type PredictedExposure = {
  predictedShutter: number;
  residualError: number;
};

const FULL_FRAME_DIAGONAL_MM = Math.hypot(36, 24);
const MAX_HANDHELD_SHUTTER = 1 / 60;
const DIFFRACTION_APERTURE = 16;
const NOTICEABLE_STOPS = 1 / 3;
const FLASH_BLUR_STOPS = 1;

export const significantMeteringBias = (bias: number | undefined): number =>
  bias !== undefined && Math.abs(bias) >= NOTICEABLE_STOPS ? bias : 0;

const penaltyWeights = {
  withinLatitude: 10,
  beyondLatitude: 100,
  blur: 30,
  narrowAperture: 5,
  compensation: 1,
} as const;

type Candidate = PredictedExposure & {
  aperture: number;
  compensation: number;
  blurStops: number;
  penalty: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const equivalentFocalLength = (
  focalLength: number,
  [frameWidth, frameHeight]: readonly [number, number],
): number => (focalLength * FULL_FRAME_DIAGONAL_MM) / Math.hypot(frameWidth, frameHeight);

export const handheldShutterLimit = (camera: ExposureCamera, film: ExposureFilm): number =>
  Math.min(1 / equivalentFocalLength(camera.focalLength, film.frameSize), MAX_HANDHELD_SHUTTER);

export const programShutterRange = (shutter: readonly ShutterMode[]): ShutterRange | undefined => {
  const programs = shutter.flatMap((mode) => (mode.kind === 'program' ? [mode] : []));

  if (programs.length === 0) {
    return undefined;
  }
  return {
    fastest: Math.min(...programs.map(({ fastest }) => fastest)),
    slowest: Math.max(...programs.map(({ slowest }) => slowest)),
  };
};

const idealShutter = (ev100: number, aperture: number, compensation: number, filmIso: number) =>
  (aperture * aperture * 2 ** compensation) / (2 ** ev100 * (filmIso / 100));

export const predictExposure = (
  ev100: number,
  aperture: number,
  compensation: number,
  filmIso: number,
  { fastest, slowest }: ShutterRange,
  meteringBias = 0,
): PredictedExposure => {
  const predictedShutter = clamp(
    idealShutter(ev100 + meteringBias, aperture, compensation, filmIso),
    fastest,
    slowest,
  );
  const correctShutter = idealShutter(ev100, aperture, 0, filmIso);
  return { predictedShutter, residualError: Math.log2(predictedShutter / correctShutter) };
};

export const programAperture = (
  ev100: number,
  apertures: readonly number[],
  compensation: number,
  filmIso: number,
  { fastest }: ShutterRange,
): number => {
  const ascending = apertures.toSorted((left, right) => left - right);
  const fitting = ascending.find(
    (aperture) => idealShutter(ev100, aperture, compensation, filmIso) >= fastest,
  );
  return fitting ?? ascending.at(-1)!;
};

const exposurePenalty = (residualError: number, latitudeStops: number) => {
  const error = Math.abs(residualError);

  if (error <= latitudeStops) {
    return error * penaltyWeights.withinLatitude;
  }
  return (
    latitudeStops * penaltyWeights.withinLatitude +
    (error - latitudeStops) * penaltyWeights.beyondLatitude
  );
};

const availableApertures = ({ apertures, effectiveAperture }: ExposureCamera): number[] => {
  if (apertures.length > 0) {
    return [...apertures];
  }
  if (effectiveAperture === undefined) {
    throw new Error('У камеры нет ни выбора диафрагмы, ни effectiveAperture');
  }
  return [effectiveAperture];
};

const availableCompensations = ({ exposureCompensation }: ExposureCamera): number[] =>
  exposureCompensation.length > 0
    ? exposureCompensation.toSorted((left, right) => Math.abs(left) - Math.abs(right))
    : [0];

const pickBest = ([first, ...rest]: Candidate[]): Candidate => {
  if (!first) {
    throw new Error('Нет ни одной комбинации настроек');
  }
  return rest.reduce(
    (best, candidate) => (candidate.penalty < best.penalty ? candidate : best),
    first,
  );
};

const meteringRangeExcess = (ev100: number, { meteringRange }: ExposureCamera) => {
  if (!meteringRange) {
    return 0;
  }
  const minEv = lvToEv100(meteringRange.minLv, meteringRange.iso);
  const maxEv = lvToEv100(meteringRange.maxLv, meteringRange.iso);

  if (ev100 > maxEv) {
    return ev100 - maxEv;
  }
  if (ev100 < minEv) {
    return ev100 - minEv;
  }
  return 0;
};

const collectWarnings = (
  best: Candidate,
  range: ShutterRange,
  latitudeStops: number,
  meteringExcess: number,
): ExposureWarning[] => {
  const warnings: ExposureWarning[] = [];

  if (best.predictedShutter === range.fastest && best.residualError > NOTICEABLE_STOPS) {
    warnings.push({ kind: 'shutter-ceiling', stops: best.residualError });
  }
  if (best.predictedShutter === range.slowest && best.residualError < -NOTICEABLE_STOPS) {
    warnings.push({ kind: 'shutter-floor', stops: -best.residualError });
  }
  if (Math.abs(best.residualError) > latitudeStops) {
    warnings.push({ kind: 'beyond-latitude', stops: Math.abs(best.residualError) });
  }
  if (best.blurStops > NOTICEABLE_STOPS) {
    warnings.push({ kind: 'blur-risk', stops: best.blurStops });
  }
  if (meteringExcess !== 0) {
    warnings.push({ kind: 'outside-metering-range', stops: meteringExcess });
  }
  return warnings;
};

const adviseFlash = (
  camera: ExposureCamera,
  { blurStops, compensation }: Candidate,
): FlashAdvice => {
  if (!camera.flash.canDisable) {
    return 'camera-decides';
  }
  if (blurStops > FLASH_BLUR_STOPS) {
    return 'on';
  }
  return camera.flash.offOnlyAtZeroCompensation && compensation !== 0 ? 'camera-decides' : 'off';
};

const chooseRationale = (camera: ExposureCamera, best: Candidate): Rationale => {
  const hasControls = camera.apertures.length > 1 || camera.exposureCompensation.length > 1;

  if (!hasControls) {
    return 'fixed-settings';
  }
  if (best.residualError > NOTICEABLE_STOPS) {
    return 'least-overexposure';
  }
  if (best.residualError < -NOTICEABLE_STOPS) {
    return 'least-underexposure';
  }
  return best.blurStops > NOTICEABLE_STOPS ? 'least-blur' : 'exact';
};

export const recommend = (
  ev100: number,
  camera: ExposureCamera,
  film: ExposureFilm,
  options: RecommendOptions = DEFAULT_RECOMMEND_OPTIONS,
): Recommendation => {
  const range = programShutterRange(camera.shutter);

  if (!range) {
    throw new Error('Камера без программного режима затвора не поддерживается движком');
  }
  const latitudeStops = film.latitudeStops ?? options.defaultLatitudeStops;
  const meteringBias = significantMeteringBias(options.meteringBias);
  const meteredEv = ev100 + meteringBias;
  const blurLimit = handheldShutterLimit(camera, film);

  const evaluate = (aperture: number, compensation: number): Candidate => {
    const exposure = predictExposure(ev100, aperture, compensation, film.iso, range, meteringBias);
    const blurStops = options.handheld
      ? Math.max(0, Math.log2(exposure.predictedShutter / blurLimit))
      : 0;
    const narrowAperturePenalty =
      options.handheld && aperture > DIFFRACTION_APERTURE ? penaltyWeights.narrowAperture : 0;
    const compensationPenalty = compensation === 0 ? 0 : penaltyWeights.compensation;

    return {
      ...exposure,
      aperture,
      compensation,
      blurStops,
      penalty:
        exposurePenalty(exposure.residualError, latitudeStops) +
        blurStops * penaltyWeights.blur +
        narrowAperturePenalty +
        compensationPenalty,
    };
  };

  const { programApertures } = camera;
  const candidates = programApertures
    ? availableCompensations(camera).map((compensation) =>
        evaluate(
          programAperture(meteredEv, programApertures, compensation, film.iso, range),
          compensation,
        ),
      )
    : availableApertures(camera).flatMap((aperture) =>
        availableCompensations(camera).map((compensation) => evaluate(aperture, compensation)),
      );
  const best = pickBest(candidates);

  return {
    aperture: camera.apertures.length > 0 ? best.aperture : null,
    exposureCompensation: camera.exposureCompensation.length > 0 ? best.compensation : null,
    flash: adviseFlash(camera, best),
    predictedAperture: best.aperture,
    predictedShutter: best.predictedShutter,
    residualError: best.residualError,
    blurStops: best.blurStops,
    warnings: collectWarnings(best, range, latitudeStops, meteringRangeExcess(meteredEv, camera)),
    rationale: chooseRationale(camera, best),
  };
};
