import type { FC } from 'react';

import { Heading, Paragraph } from '@heroui/react';
import { useAtomValue } from 'jotai';

import { currentMeasurementAtom, MeasurementSummary } from '@/entities/measurement';
import { MeasureScene } from '@/features/measureScene';
import { strings } from '@/shared/config';
import { AdviceCard } from '@/widgets/adviceCard';

export const MeasurePage: FC = () => {
  const measurement = useAtomValue(currentMeasurementAtom);

  return (
    <section className="flex flex-col gap-4">
      <Heading level={1}>{strings.measurePage.title}</Heading>
      {measurement ? (
        <MeasurementSummary measurement={measurement} />
      ) : (
        <Paragraph className="text-muted">{strings.measurePage.placeholder}</Paragraph>
      )}
      <MeasureScene />
      <AdviceCard />
    </section>
  );
};
