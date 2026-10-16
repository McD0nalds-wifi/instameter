import type { ExposureWarning, Recommendation } from '@/shared/lib/exposure';

import { strings } from '@/shared/config';
import { formatAperture, formatShutter, formatStops } from '@/shared/lib/format';
import { pluralize } from '@/shared/lib/plural';

export type SettingRow = {
  label: string;
  value: string;
};

export type WarningText = {
  kind: ExposureWarning['kind'];
  tone: 'warning' | 'danger';
  title: string;
  description: string;
};

const roundStops = (stops: number) => Math.round(stops * 10) / 10;

export const describeStops = (stops: number): string => {
  const rounded = roundStops(Math.abs(stops));
  return `${formatStops(rounded).replace('+', '')} ${pluralize(rounded, strings.advice.stops)}`;
};

export const describeSettings = (recommendation: Recommendation): SettingRow[] => {
  const { settings, flash } = strings.advice;
  const rows: SettingRow[] = [];

  if (recommendation.aperture !== null) {
    rows.push({ label: settings.aperture, value: formatAperture(recommendation.aperture) });
  }
  if (recommendation.exposureCompensation !== null) {
    rows.push({
      label: settings.compensation,
      value: formatStops(recommendation.exposureCompensation),
    });
  }
  rows.push(
    { label: settings.flash, value: flash[recommendation.flash] },
    { label: settings.shutter, value: formatShutter(recommendation.predictedShutter) },
  );
  return rows;
};

export const describeRationale = ({ rationale }: Recommendation): string =>
  strings.advice.rationale[rationale];

const describeWarning = (warning: ExposureWarning): WarningText => {
  const texts = strings.advice.warnings;
  const amount = describeStops(warning.stops);

  switch (warning.kind) {
    case 'shutter-ceiling': {
      return {
        kind: warning.kind,
        tone: 'warning',
        title: `${texts.shutterCeilingTitle} на ${amount}`,
        description: texts.shutterCeilingDescription,
      };
    }
    case 'shutter-floor': {
      return {
        kind: warning.kind,
        tone: 'warning',
        title: `${texts.shutterFloorTitle} на ${amount}`,
        description: texts.shutterFloorDescription,
      };
    }
    case 'beyond-latitude': {
      return {
        kind: warning.kind,
        tone: 'danger',
        title: texts.beyondLatitudeTitle,
        description: `${texts.beyondLatitudeDescription} ${amount}.`,
      };
    }
    case 'blur-risk': {
      return {
        kind: warning.kind,
        tone: 'warning',
        title: texts.blurTitle,
        description: `${texts.blurDescription} ${amount}.`,
      };
    }
    case 'outside-metering-range': {
      return {
        kind: warning.kind,
        tone: 'warning',
        title: warning.stops > 0 ? texts.tooBrightTitle : texts.tooDarkTitle,
        description: `${warning.stops > 0 ? texts.outsideRangeBrighter : texts.outsideRangeDarker} ${amount}.`,
      };
    }
  }
};

export const describeWarnings = (warnings: ExposureWarning[]): WarningText[] =>
  warnings.map(describeWarning);
