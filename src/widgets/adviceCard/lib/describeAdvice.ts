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

type AdviceReminder =
  'film-type-menu' | 'ev-dial-zero' | 'flash-resets-on' | 'compensation-ambient-only';

export type AdviceContext = {
  recommendation: Recommendation;
  flashControllable: boolean;
  adviceMode?: 'auto' | 'aperture-priority';
  flashRange?: { min: number; max: number | null };
  reminders?: AdviceReminder[];
  hasProgramAperture?: boolean;
  compensationLabels?: { value: number; label: string }[];
};

const LABEL_TOLERANCE = 1e-6;

const describeCompensation = (
  compensation: number,
  labels: AdviceContext['compensationLabels'],
): string => {
  const dialLabel = labels?.find(({ value }) => Math.abs(value - compensation) < LABEL_TOLERANCE);
  return dialLabel
    ? `${dialLabel.label} (${formatThirds(compensation)})`
    : formatThirds(compensation);
};

const isReminderRelevant = (reminder: AdviceReminder, recommendation: Recommendation) => {
  if (reminder === 'flash-resets-on') {
    return recommendation.flash === 'off';
  }
  if (reminder === 'compensation-ambient-only') {
    return recommendation.flash === 'on' && (recommendation.exposureCompensation ?? 0) !== 0;
  }
  return true;
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
  compensationLabels,
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
      value: describeCompensation(recommendation.exposureCompensation, compensationLabels),
    });
  }
  if (flashControllable) {
    rows.push({ label: settings.flash, value: flash[recommendation.flash] });
  }
  return rows;
};

const describeFlashNote = ({ flashControllable, flashRange }: AdviceContext) => {
  const { notes } = strings.advice;

  if (flashControllable) {
    return;
  }
  return flashRange
    ? `${notes.cameraFlashRange} ${describeDistanceRange(flashRange)}.`
    : notes.cameraFlash;
};

export const describeNotes = (context: AdviceContext): string[] => {
  const { notes, reminders } = strings.advice;
  const { recommendation } = context;
  const shutterText = formatShutter(recommendation.predictedShutter);
  const shutter = context.hasProgramAperture
    ? `${notes.programExposure} ${formatAperture(recommendation.predictedAperture)} и ${shutterText}, ${notes.programExposureSuffix}`
    : `${notes.shutter} ${shutterText}, ${notes.shutterSuffix}`;
  const reminderNotes = (context.reminders ?? [])
    .filter((reminder) => isReminderRelevant(reminder, recommendation))
    .map((reminder) => reminders[reminder]);

  return [shutter, describeFlashNote(context), ...reminderNotes].filter(
    (note): note is string => note !== undefined,
  );
};

export const describeRationale = ({ rationale }: Recommendation): string =>
  strings.advice.rationale[rationale];

export type WarningContext = {
  residualError: number;
  filterThread?: number;
  flashControllable: boolean;
};

const sentence = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

const describeNdFilter = (stops: number, filterThread: number) => {
  const texts = strings.advice.warnings;
  const filterStops = Math.max(1, Math.round(stops));
  return `${texts.ndFilter} ND${2 ** filterStops} ${texts.ndFilterThread} ${filterThread}${NO_BREAK_SPACE}мм — ${texts.ndFilterEffect} ${describeStops(filterStops)}.`;
};

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
            describeNdFilter(warning.stops, context.filterThread),
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
