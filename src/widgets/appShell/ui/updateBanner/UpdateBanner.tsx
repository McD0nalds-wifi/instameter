import type { FC } from 'react';

import { Alert, Button } from '@heroui/react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { strings } from '@/shared/config';

export const UpdateBanner: FC = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) {
    return null;
  }

  const reloadWithNewVersion = () => void updateServiceWorker(true);

  return (
    <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{strings.update.available}</Alert.Title>
      </Alert.Content>
      <Button size="sm" variant="primary" onPress={reloadWithNewVersion}>
        {strings.update.reload}
      </Button>
    </Alert>
  );
};
