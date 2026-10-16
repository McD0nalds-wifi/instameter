import type { ExposureWarning, Recommendation } from '@/shared/lib/exposure';

import { strings } from '@/shared/config';
import { formatAperture, formatShutter, formatStops, formatThirds } from '@/shared/lib/format';
import { pluralize } from '@/shared/lib/plural';

export type SettingRow = {
  label: string;
  value: string;
  isWide?: boolean;
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

export type AdviceContext = {
  recommendation: Recommendation;
  flashControllable: boolean;
  adviceMode?: 'auto' | 'aperture-priority';
  flashRange?: { min: number; max: number | null };
};

const distanceFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

const describeDistanceRange = ({ min, max }: { min: number; max: number | null }) =>
  max === null
    ? `от ${distanceFormat.format(min)}${NO_BREAK_SPACE}м`
    : `${distanceFormat.format(min)}–${distanceFormat.format(max)}${NO_BREAK_SPACE}м`;

export const describeSettings = ({
  recommendation,
  flashControllable,
  adviceMode,
}: AdviceContext): SettingRow[] => {
  const { settings, flash, modes } = strings.advice;
  const rows: SettingRow[] = [];

  if (adviceMode) {
    rows.push({ label: settings.mode, value: modes[adviceMode], isWide: true });
  }
  if (recommendation.aperture !== null) {
    rows.push({ label: settings.aperture, value: formatAperture(recommendation.aperture) });
  }
  if (recommendation.exposureCompensation !== null) {
    rows.push({
      label: settings.compensation,
      value: formatThirds(recommendation.exposureCompensation),
    });
  }
  if (flashControllable && recommendation.flash !== 'camera-decides') {
    rows.push({ label: settings.flash, value: flash[recommendation.flash] });
  }
  return rows;
};

export const describeNotes = ({
  recommendation,
  flashControllable,
  flashRange,
}: AdviceContext): string[] => {
  const { notes } = strings.advice;
  const shutter = `${notes.shutter} ${formatShutter(recommendation.predictedShutter)}, ${notes.shutterSuffix}`;

  if (flashControllable) {
    return [shutter];
  }
  const flashNote = flashRange
    ? `${notes.cameraFlashRange} ${describeDistanceRange(flashRange)}.`
    : notes.cameraFlash;
  return [shutter, flashNote];
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
