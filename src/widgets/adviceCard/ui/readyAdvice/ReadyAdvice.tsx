import type { AdviceState } from '../../model/advice';
import type { FC } from 'react';

import { Button, Card, Paragraph } from '@heroui/react';
import { useLocation } from 'wouter';

import { describeRationale, describeSettings, describeWarnings } from '../../lib/describeAdvice';
import { AdviceSettings } from '../adviceSettings/AdviceSettings';
import { AdviceWarnings } from '../adviceWarnings/AdviceWarnings';

import { paths, strings } from '@/shared/config';

type ReadyAdviceProps = {
  advice: Extract<AdviceState, { kind: 'ready' }>;
};

export const ReadyAdvice: FC<ReadyAdviceProps> = ({
  advice: { cameraName, filmName, recommendation, filterThread, flashControllable },
}) => {
  const [, navigate] = useLocation();
  const openMyCameras = () => navigate(paths.myCameras);
  const warnings = describeWarnings(recommendation.warnings, {
    residualError: recommendation.residualError,
    filterThread,
    flashControllable,
  });

  return (
    <Card aria-label={`${strings.advice.title} для ${cameraName}`}>
      <Card.Header className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Card.Title>{cameraName}</Card.Title>
          <Card.Description>{filmName}</Card.Description>
        </div>
        <Button size="sm" variant="ghost" className="min-h-11" onPress={openMyCameras}>
          {strings.advice.changeCamera}
        </Button>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <AdviceSettings rows={describeSettings(recommendation)} />
        <Paragraph size="sm">{describeRationale(recommendation)}</Paragraph>
        {warnings.length > 0 && <AdviceWarnings warnings={warnings} />}
      </Card.Content>
    </Card>
  );
};
