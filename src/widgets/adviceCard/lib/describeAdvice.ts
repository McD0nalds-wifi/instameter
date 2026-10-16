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

const NO_BREAK_SPACE = '\u00A0';

const roundStops = (stops: number) => Math.round(stops * 10) / 10;

export const describeStops = (stops: number): string => {
  const rounded = roundStops(Math.abs(stops));
  return `${formatStops(rounded).replace('+', '')}${NO_BREAK_SPACE}${pluralize(rounded, strings.advice.stops)}`;
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

export type WarningContext = {
  residualError: number;
  filterThread?: number;
  flashControllable: boolean;
};

const sentence = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

const describeWarning = (warning: ExposureWarning, context: WarningContext): WarningText => {
  const texts = strings.advice.warnings;
  const amount = describeStops(warning.stops);

  switch (warning.kind) {
    case 'shutter-ceiling': {
      return {
        kind: warning.kind,
        tone: 'warning',
        title: `${texts.tooBrightTitle} ${amount}`,
        description: sentence(
          texts.tooBrightDescription,
          context.filterThread !== undefined &&
            `${texts.ndFilter} ${context.filterThread}${NO_BREAK_SPACE}мм.`,
        ),
      };
    }
    case 'shutter-floor': {
      return {
        kind: warning.kind,
        tone: 'warning',
        title: `${texts.tooDarkTitle} ${amount}`,
        description: context.flashControllable ? texts.tooDarkWithFlash : texts.tooDarkWithoutFlash,
      };
    }
    case 'beyond-latitude': {
      return {
        kind: warning.kind,
        tone: 'danger',
        title: context.residualError > 0 ? texts.lostWhiteTitle : texts.lostDarkTitle,
        description: sentence(`${texts.lostDescription} ${amount}.`, texts.lostAdvice),
      };
    }
    case 'blur-risk': {
      return {
        kind: warning.kind,
        tone: 'warning',
        title: texts.blurTitle,
        description: sentence(`${texts.blurDescription} ${amount}.`, texts.blurAdvice),
      };
    }
    case 'outside-metering-range': {
      const isBright = warning.stops > 0;
      return {
        kind: warning.kind,
        tone: 'warning',
        title: isBright ? texts.outsideBrightTitle : texts.outsideDarkTitle,
        description: sentence(
          `${isBright ? texts.outsideBrightDescription : texts.outsideDarkDescription} ${amount}.`,
          isBright ? texts.outsideBrightAdvice : texts.outsideDarkAdvice,
        ),
      };
    }
  }
};

export const describeWarnings = (
  warnings: ExposureWarning[],
  context: WarningContext,
): WarningText[] => warnings.map((warning) => describeWarning(warning, context));
