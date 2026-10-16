import { atom } from 'jotai';

import { buildAdvice } from './advice';

import { currentMeasurementAtom } from '@/entities/measurement';
import { activeCameraAtom } from '@/entities/userCamera';

export const adviceAtom = atom((get) =>
  buildAdvice(get(currentMeasurementAtom), get(activeCameraAtom)),
);
