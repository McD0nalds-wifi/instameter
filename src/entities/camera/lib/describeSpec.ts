import type { CameraSpec } from '../model/cameraSpec';

import { strings } from '@/shared/config';
import { formatAperture, formatShutter } from '@/shared/lib/format';

export const describeApertures = ({ apertures, effectiveAperture }: CameraSpec): string => {
  if (apertures.length > 0) {
    return apertures.map(formatAperture).join(', ');
  }
  return effectiveAperture === undefined
    ? '—'
    : `${formatAperture(effectiveAperture)}, ${strings.cameraSpec.fixedAperture}`;
};

export const describeShutter = ({ shutter }: CameraSpec): string => {
  const programs = shutter.flatMap((mode) => (mode.kind === 'program' ? [mode] : []));

  if (programs.length === 0) {
    return '—';
  }
  const fastest = Math.min(...programs.map(({ fastest: value }) => value));
  const slowest = Math.max(...programs.map(({ slowest: value }) => value));
  return `${formatShutter(slowest).replace(' с', '')} – ${formatShutter(fastest)}`;
};
