export type PixelGrid = {
  width: number;
  height: number;
  data: ArrayLike<number>;
};

export type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DEFAULT_SUBJECT_REGION: Region = { x: 0.4, y: 0.4, width: 0.2, height: 0.2 };

const MAX_BIAS_STOPS = 3;
const CENTER_SIGMA = 0.35;
const BASE_WEIGHT = 0.3;
const MIN_LUMINANCE = 1e-4;

const srgbToLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const pixelLuminance = (data: ArrayLike<number>, offset: number) =>
  0.2126 * srgbToLinear(data[offset] ?? 0) +
  0.7152 * srgbToLinear(data[offset + 1] ?? 0) +
  0.0722 * srgbToLinear(data[offset + 2] ?? 0);

const centerWeight = (u: number, v: number) => {
  const distanceSquared = (u - 0.5) ** 2 + (v - 0.5) ** 2;
  return BASE_WEIGHT + Math.exp(-distanceSquared / (2 * CENTER_SIGMA ** 2));
};

const isInside = (u: number, v: number, { x, y, width, height }: Region) =>
  u >= x && u <= x + width && v >= y && v <= y + height;

type Accumulator = {
  frameSum: number;
  frameWeight: number;
  subjectSum: number;
  subjectCount: number;
};

const accumulate = ({ width, height, data }: PixelGrid, subject: Region): Accumulator =>
  Array.from({ length: width * height }).reduce<Accumulator>(
    (totals, _, index) => {
      const u = ((index % width) + 0.5) / width;
      const v = (Math.floor(index / width) + 0.5) / height;
      const luminance = pixelLuminance(data, index * 4);
      const weight = centerWeight(u, v);
      const inSubject = isInside(u, v, subject);

      return {
        frameSum: totals.frameSum + luminance * weight,
        frameWeight: totals.frameWeight + weight,
        subjectSum: totals.subjectSum + (inSubject ? luminance : 0),
        subjectCount: totals.subjectCount + (inSubject ? 1 : 0),
      };
    },
    { frameSum: 0, frameWeight: 0, subjectSum: 0, subjectCount: 0 },
  );

export type MeteringEstimate = {
  frameLuminance: number;
  subjectLuminance: number;
  biasStops: number;
};

export const estimateMeteringBias = (
  grid: PixelGrid,
  subject: Region = DEFAULT_SUBJECT_REGION,
): MeteringEstimate | undefined => {
  const totals = accumulate(grid, subject);

  if (totals.subjectCount === 0 || totals.frameWeight === 0) {
    return undefined;
  }
  const frameLuminance = totals.frameSum / totals.frameWeight;
  const subjectLuminance = totals.subjectSum / totals.subjectCount;
  const rawBias = Math.log2(
    Math.max(frameLuminance, MIN_LUMINANCE) / Math.max(subjectLuminance, MIN_LUMINANCE),
  );

  return {
    frameLuminance,
    subjectLuminance,
    biasStops: Math.min(Math.max(rawBias, -MAX_BIAS_STOPS), MAX_BIAS_STOPS),
  };
};
