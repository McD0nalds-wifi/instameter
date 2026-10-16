import type { MeasureFailure } from '../../model/errorMessage';
import type { FC } from 'react';

import { Alert } from '@heroui/react';

import { errorMessage } from '../../model/errorMessage';

type MeasureErrorProps = {
  failure: MeasureFailure;
};

export const MeasureError: FC<MeasureErrorProps> = ({ failure }) => {
  const { title, description } = errorMessage(failure);

  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{description}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
};
