import type { AppDb } from './appDb';

import { atom } from 'jotai';

export const appDbAtom = atom<AppDb | null>(null);
