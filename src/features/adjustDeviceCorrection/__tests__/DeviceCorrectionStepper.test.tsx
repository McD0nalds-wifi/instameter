import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';

import { canStep, stepCorrection } from '../model/steps';
import { DeviceCorrectionStepper } from '../ui/DeviceCorrectionStepper';

import { deviceCorrectionAtom } from '@/entities/preference';
import { setupUser } from '@/shared/lib/testing';

describe('шаги поправки', () => {
  it('ходит третями ступени и не выходит за ±2', () => {
    expect(stepCorrection(0, -1)).toBeCloseTo(-1 / 3);
    expect(stepCorrection(-1 / 3, -1)).toBeCloseTo(-2 / 3);
    expect(stepCorrection(0.3, 1)).toBeCloseTo(2 / 3);
    expect(stepCorrection(2, 1)).toBe(2);
    expect(canStep(2, 1)).toBe(false);
    expect(canStep(-2, -1)).toBe(false);
    expect(canStep(0, 1)).toBe(true);
  });
});

describe('DeviceCorrectionStepper', () => {
  it('меняет поправку кнопками и сбрасывает её', async () => {
    const user = setupUser();
    const store = createStore();

    render(
      <Provider store={store}>
        <DeviceCorrectionStepper />
      </Provider>,
    );

    expect(screen.getByText('0 EV')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сбросить' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Уменьшить поправку на 1/3 ступени' }));
    await user.click(screen.getByRole('button', { name: 'Уменьшить поправку на 1/3 ступени' }));

    expect(screen.getByText('−2/3 EV')).toBeInTheDocument();
    expect(store.get(deviceCorrectionAtom)).toBeCloseTo(-2 / 3);

    await user.click(screen.getByRole('button', { name: 'Сбросить' }));

    expect(store.get(deviceCorrectionAtom)).toBe(0);
    expect(screen.getByText('0 EV')).toBeInTheDocument();
  });
});
