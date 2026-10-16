import type { WarningText } from '../../lib/describeAdvice';
import type { FC } from 'react';

import { Alert } from '@heroui/react';

type AdviceWarningsProps = {
  warnings: WarningText[];
};

export const AdviceWarnings: FC<AdviceWarningsProps> = ({ warnings }) => (
  <ul className="flex flex-col gap-2">
    {warnings.map(({ kind, tone, title, description }) => (
      <li key={kind}>
        <Alert status={tone}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{title}</Alert.Title>
            <Alert.Description>{description}</Alert.Description>
          </Alert.Content>
        </Alert>
      </li>
    ))}
  </ul>
);
