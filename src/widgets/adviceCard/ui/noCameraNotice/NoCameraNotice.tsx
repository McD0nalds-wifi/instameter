import type { FC } from 'react';

import { Alert, Button } from '@heroui/react';
import { useLocation } from 'wouter';

import { paths, strings } from '@/shared/config';

export const NoCameraNotice: FC = () => {
  const [, navigate] = useLocation();
  const openCatalog = () => navigate(paths.catalog);

  return (
    <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{strings.advice.noCameraTitle}</Alert.Title>
        <Alert.Description>{strings.advice.noCameraDescription}</Alert.Description>
      </Alert.Content>
      <Button size="sm" variant="primary" onPress={openCatalog}>
        {strings.advice.noCameraAction}
      </Button>
    </Alert>
  );
};
