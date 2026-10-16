import type { MeasureFailure } from '../../model/errorMessage';
import type { FC } from 'react';

import { Alert } from '@heroui/react';

import { errorMessage } from '../../model/errorMessage';

type MeasureErrorProps = {
  failure: MeasureFailure;
  isIos: boolean;
};

export const MeasureError: FC<MeasureErrorProps> = ({ failure, isIos }) => {
  const { title, description } = errorMessage(failure, isIos);

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
