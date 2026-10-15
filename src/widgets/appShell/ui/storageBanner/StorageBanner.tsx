import type { FC } from 'react';

import { Alert } from '@heroui/react';
import { useAtomValue } from 'jotai';

import { appDbAtom } from '@/shared/api';
import { strings } from '@/shared/config';

export const StorageBanner: FC = () => {
  const db = useAtomValue(appDbAtom);

  if (db) {
    return null;
  }

  return (
    <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{strings.storage.unavailableTitle}</Alert.Title>
        <Alert.Description>{strings.storage.unavailableDescription}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
};
