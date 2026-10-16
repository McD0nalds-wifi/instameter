import type { FC } from 'react';

import { Alert, CloseButton } from '@heroui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Share } from 'lucide-react';
import { useState } from 'react';

import { dismissInstallHintAtom, installHintDismissedAtom } from '@/entities/preference';
import { strings } from '@/shared/config';
import { isIosWebKit, isStandalone } from '@/shared/lib/platform';

const shouldOfferInstall = () => isIosWebKit() && !isStandalone();

export const InstallHint: FC = () => {
  const [canInstall] = useState(shouldOfferInstall);
  const isDismissed = useAtomValue(installHintDismissedAtom);
  const dismiss = useSetAtom(dismissInstallHintAtom);

  if (!canInstall || isDismissed) {
    return null;
  }

  const hide = () => void dismiss();

  return (
    <Alert status="accent">
      <Alert.Indicator>
        <Share aria-hidden size={18} />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{strings.installHint.title}</Alert.Title>
        <Alert.Description>{strings.installHint.description}</Alert.Description>
      </Alert.Content>
      <CloseButton
        aria-label={strings.installHint.dismiss}
        className="min-h-11 min-w-11"
        onPress={hide}
      />
    </Alert>
  );
};
