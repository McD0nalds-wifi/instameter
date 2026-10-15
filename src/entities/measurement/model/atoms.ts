import type { Measurement } from './measurement';

import { atom } from 'jotai';

export const currentMeasurementAtom = atom<Measurement | null>(null);
