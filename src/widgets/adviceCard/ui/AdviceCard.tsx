import type { FC } from 'react';

import { Alert } from '@heroui/react';
import { useAtomValue } from 'jotai';

import { adviceAtom } from '../model/atoms';
import { NoCameraNotice } from './noCameraNotice/NoCameraNotice';
import { ReadyAdvice } from './readyAdvice/ReadyAdvice';

import { strings } from '@/shared/config';

export const AdviceCard: FC = () => {
  const advice = useAtomValue(adviceAtom);

  if (advice.kind === 'no-measurement') {
    return null;
  }
  if (advice.kind === 'no-camera') {
    return <NoCameraNotice />;
  }
  if (advice.kind === 'unsupported-camera') {
    return (
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{strings.advice.unsupportedTitle}</Alert.Title>
          <Alert.Description>{strings.advice.unsupportedDescription}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return <ReadyAdvice advice={advice} />;
};
