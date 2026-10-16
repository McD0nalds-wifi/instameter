import type { FC } from 'react';

import { Button, Label, Paragraph, Typography } from '@heroui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';

import { canStep, stepCorrection } from '../model/steps';

import { deviceCorrectionAtom, saveDeviceCorrectionAtom } from '@/entities/preference';
import { strings } from '@/shared/config';
import { formatThirds } from '@/shared/lib/format';

export const DeviceCorrectionStepper: FC = () => {
  const labelId = useId();
  const correction = useAtomValue(deviceCorrectionAtom);
  const saveCorrection = useSetAtom(saveDeviceCorrectionAtom);
  const texts = strings.deviceCorrection;

  const decrease = () => void saveCorrection(stepCorrection(correction, -1));
  const increase = () => void saveCorrection(stepCorrection(correction, 1));
  const reset = () => void saveCorrection(0);

  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={labelId}>
      <Label id={labelId}>{texts.label}</Label>
      <Paragraph size="sm" className="text-muted">
        {texts.description}
      </Paragraph>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          isIconOnly
          className="min-h-11 min-w-11"
          aria-label={texts.decrease}
          isDisabled={!canStep(correction, -1)}
          onPress={decrease}
        >
          <Minus aria-hidden size={18} />
        </Button>
        <output aria-live="polite" className="min-w-20 text-center">
          <Typography type="h3">
            {formatThirds(correction)} {texts.unit}
          </Typography>
        </output>
        <Button
          variant="secondary"
          isIconOnly
          className="min-h-11 min-w-11"
          aria-label={texts.increase}
          isDisabled={!canStep(correction, 1)}
          onPress={increase}
        >
          <Plus aria-hidden size={18} />
        </Button>
        {correction !== 0 && (
          <Button variant="ghost" className="min-h-11" onPress={reset}>
            {texts.reset}
          </Button>
        )}
      </div>
    </div>
  );
};
