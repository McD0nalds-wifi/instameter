import type { Region } from '../scene';

type Center = {
  cx: number;
  cy: number;
  width: number;
  height: number;
};

const MIN_REGION_SIZE = 0.08;
const POINT_REGION_SIZE = 0.12;

const toNumbers = (value: unknown): number[] => {
  if (value === null || typeof value !== 'object') {
    return [];
  }
  const numbers = Array.from(value as ArrayLike<unknown>);
  return numbers.every((item) => typeof item === 'number') ? (numbers as number[]) : [];
};

const areaToCenter = (area: number[], imageWidth: number, imageHeight: number) => {
  const [x, y, first, second] = area;

  if (x === undefined || y === undefined) {
    return;
  }
  const width = second === undefined ? (first ?? 0) : first!;
  const height = second ?? first ?? 0;
  return {
    cx: x / imageWidth,
    cy: y / imageHeight,
    width: Math.max(width / imageWidth, area.length === 2 ? POINT_REGION_SIZE : MIN_REGION_SIZE),
    height: Math.max(height / imageHeight, area.length === 2 ? POINT_REGION_SIZE : MIN_REGION_SIZE),
  };
};

const orient = ({ cx, cy, width, height }: Center, orientation: number): Center => {
  switch (orientation) {
    case 2: {
      return { cx: 1 - cx, cy, width, height };
    }
    case 3: {
      return { cx: 1 - cx, cy: 1 - cy, width, height };
    }
    case 4: {
      return { cx, cy: 1 - cy, width, height };
    }
    case 5: {
      return { cx: cy, cy: cx, width: height, height: width };
    }
    case 6: {
      return { cx: 1 - cy, cy: cx, width: height, height: width };
    }
    case 7: {
      return { cx: 1 - cy, cy: 1 - cx, width: height, height: width };
    }
    case 8: {
      return { cx: cy, cy: 1 - cx, width: height, height: width };
    }
    default: {
      return { cx, cy, width, height };
    }
  }
};

const clampUnit = (value: number) => Math.min(Math.max(value, 0), 1);

const centerToRegion = ({ cx, cy, width, height }: Center): Region => {
  const x = clampUnit(cx - width / 2);
  const y = clampUnit(cy - height / 2);
  return {
    x,
    y,
    width: clampUnit(cx + width / 2) - x,
    height: clampUnit(cy + height / 2) - y,
  };
};

export const subjectRegionFromTags = (tags: Record<string, unknown>): Region | undefined => {
  const area = toNumbers(tags.SubjectArea);
  const imageWidth = tags.ExifImageWidth;
  const imageHeight = tags.ExifImageHeight;

  if (
    area.length < 2 ||
    typeof imageWidth !== 'number' ||
    typeof imageHeight !== 'number' ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return undefined;
  }
  const center = areaToCenter(area, imageWidth, imageHeight);
  const orientation = typeof tags.Orientation === 'number' ? tags.Orientation : 1;
  return center ? centerToRegion(orient(center, orientation)) : undefined;
};
