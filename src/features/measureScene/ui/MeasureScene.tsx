import type { MeasureFailure } from '../model/errorMessage';
import type { FC } from 'react';

import { Button, Paragraph } from '@heroui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Camera, Images } from 'lucide-react';
import { useState } from 'react';
import { FileTrigger } from 'react-aria-components';

import { MeasureError } from './measureError/MeasureError';

import { createExifMeasurement, currentMeasurementAtom } from '@/entities/measurement';
import { deviceCorrectionAtom } from '@/entities/preference';
import { strings } from '@/shared/config';
import { readExposure } from '@/shared/lib/exif';
import { isIosWebKit } from '@/shared/lib/platform';
import { estimateMeteringBias, readPixels } from '@/shared/lib/scene';

const ACCEPTED_TYPES = ['image/jpeg', 'image/heic', 'image/heif'];

type MeasureStatus =
  { kind: 'idle' } | { kind: 'reading' } | { kind: 'failed'; failure: MeasureFailure };

export const MeasureScene: FC = () => {
  const deviceCorrection = useAtomValue(deviceCorrectionAtom);
  const setMeasurement = useSetAtom(currentMeasurementAtom);
  const [status, setStatus] = useState<MeasureStatus>({ kind: 'idle' });
  const [isIos] = useState(isIosWebKit);

  const measureFile = async (file: File) => {
    setStatus({ kind: 'reading' });
    const result = await readExposure(file);

    if (result.status === 'ok') {
      const pixels = await readPixels(file);
      const estimate = pixels && estimateMeteringBias(pixels, result.subjectRegion);
      setMeasurement(
        createExifMeasurement(result.exposure, deviceCorrection, Date.now(), estimate?.biasStops),
      );
      setStatus({ kind: 'idle' });
      return;
    }
    setStatus({ kind: 'failed', failure: result });
  };

  const handleSelect = (files: FileList | null) => {
    const file = files?.[0];

    if (file) {
      void measureFile(file);
    }
  };

  const isReading = status.kind === 'reading';

  return (
    <div className="flex flex-col gap-3">
      <Paragraph size="sm" className="text-muted">
        {isIos ? strings.measure.iosHint : strings.measure.hint}
      </Paragraph>
      {isIos ? (
        <FileTrigger acceptedFileTypes={ACCEPTED_TYPES} onSelect={handleSelect}>
          <Button variant="primary" className="min-h-11" isDisabled={isReading}>
            <Images aria-hidden size={18} />
            {strings.measure.choosePhoto}
          </Button>
        </FileTrigger>
      ) : (
        <div className="flex gap-2">
          <FileTrigger
            acceptedFileTypes={ACCEPTED_TYPES}
            defaultCamera="environment"
            onSelect={handleSelect}
          >
            <Button variant="primary" className="min-h-11 flex-1" isDisabled={isReading}>
              <Camera aria-hidden size={18} />
              {strings.measure.takePhoto}
            </Button>
          </FileTrigger>
          <FileTrigger acceptedFileTypes={ACCEPTED_TYPES} onSelect={handleSelect}>
            <Button variant="secondary" className="min-h-11 flex-1" isDisabled={isReading}>
              <Images aria-hidden size={18} />
              {strings.measure.fromGallery}
            </Button>
          </FileTrigger>
        </div>
      )}
      {isReading && <Paragraph size="sm">{strings.measure.reading}</Paragraph>}
      {status.kind === 'failed' && <MeasureError failure={status.failure} isIos={isIos} />}
    </div>
  );
};
