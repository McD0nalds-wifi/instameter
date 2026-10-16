import type { Measurement } from '../../model/measurement';
import type { FC } from 'react';

import { Paragraph, Typography } from '@heroui/react';

import { describeScene } from '../../lib/describeScene';

import { strings } from '@/shared/config';
import { formatAperture, formatEv, formatShutter, formatStops } from '@/shared/lib/format';

type MeasurementSummaryProps = {
  measurement: Measurement;
};

const describeExif = (exif: NonNullable<Measurement['exif']>) =>
  [
    formatAperture(exif.fNumber),
    formatShutter(exif.exposureTime),
    `ISO ${exif.iso}`,
    exif.exposureBias ? `${strings.measurement.phoneBias} ${formatStops(exif.exposureBias)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

export const MeasurementSummary: FC<MeasurementSummaryProps> = ({
  measurement: { ev100, exif },
}) => (
  <div className="flex flex-col gap-1">
    <Typography type="h2">{describeScene(ev100)}</Typography>
    <Paragraph size="sm" className="text-muted">
      {strings.measurement.brightness}: {formatEv(ev100)} EV
      {exif ? ` · ${describeExif(exif)}` : ''}
    </Paragraph>
  </div>
);
