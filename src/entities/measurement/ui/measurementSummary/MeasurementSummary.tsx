import type { Measurement } from '../../model/measurement';
import type { FC } from 'react';

import { Paragraph, Typography } from '@heroui/react';

import { strings } from '@/shared/config';
import { formatAperture, formatEv, formatShutter, formatStops } from '@/shared/lib/format';

type MeasurementSummaryProps = {
  measurement: Measurement;
};

export const MeasurementSummary: FC<MeasurementSummaryProps> = ({
  measurement: { ev100, exif },
}) => (
  <div className="flex flex-col gap-1">
    <Typography type="h2">
      {strings.measurement.ev100} {formatEv(ev100)}
    </Typography>
    {exif && (
      <Paragraph size="sm" className="text-muted">
        {formatAperture(exif.fNumber)} · {formatShutter(exif.exposureTime)} · ISO {exif.iso}
        {exif.exposureBias
          ? ` · ${strings.measurement.phoneBias} ${formatStops(exif.exposureBias)}`
          : ''}
      </Paragraph>
    )}
  </div>
);
