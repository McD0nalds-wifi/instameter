import type { ExifReadResult } from '@/shared/lib/exif';

import { strings } from '@/shared/config';

export type MeasureFailure = Exclude<ExifReadResult, { status: 'ok' }>;

export type ErrorMessage = {
  title: string;
  description: string;
};

const listMissingFields = (failure: Extract<MeasureFailure, { status: 'missing-fields' }>) =>
  failure.missing.map((field) => strings.measure.fields[field]).join(', ');

export const errorMessage = (failure: MeasureFailure, isIos: boolean): ErrorMessage => {
  const { errors } = strings.measure;

  if (failure.status === 'missing-fields') {
    return {
      title: errors.missingFieldsTitle,
      description: `${errors.missingFieldsDescription}: ${listMissingFields(failure)}.`,
    };
  }
  if (failure.status === 'unreadable') {
    return { title: errors.unreadableTitle, description: errors.unreadableDescription };
  }
  if (isIos) {
    return { title: errors.iosNoExifTitle, description: errors.iosNoExifDescription };
  }
  return { title: errors.noExifTitle, description: errors.noExifDescription };
};
