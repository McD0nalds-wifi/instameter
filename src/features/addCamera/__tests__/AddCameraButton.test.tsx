import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

import { AddCameraButton } from '../ui/AddCameraButton';

import { findCameraSpec } from '@/entities/camera';
import { currentMeasurementAtom } from '@/entities/measurement';
import { activeCameraAtom, userCamerasAtom } from '@/entities/userCamera';
import { setupUser } from '@/shared/lib/testing';

describe('AddCameraButton', () => {
  it('добавляет камеру из каталога, делает её активной и открывает «Мои камеры»', async () => {
    const user = setupUser();
    const store = createStore();
    const location = memoryLocation({ path: '/catalog', record: true });
    const spec = findCameraSpec('instax-mini-12')!;

    render(
      <Provider store={store}>
        <Router hook={location.hook}>
          <AddCameraButton spec={spec} />
        </Router>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(store.get(userCamerasAtom)).toMatchObject([
      { specId: 'instax-mini-12', nickname: 'Instax Mini 12' },
    ]);
    expect(store.get(activeCameraAtom)?.specId).toBe('instax-mini-12');
    expect(location.history).toEqual(['/catalog', '/cameras']);
    expect(screen.getByRole('button', { name: 'Уже добавлена' })).toBeDisabled();
  });

  it('возвращает на «Замер», если замер уже сделан', async () => {
    const user = setupUser();
    const store = createStore();
    store.set(currentMeasurementAtom, { ev100: 12, source: 'exif', confidence: 'high', at: 0 });
    const location = memoryLocation({ path: '/catalog', record: true });

    render(
      <Provider store={store}>
        <Router hook={location.hook}>
          <AddCameraButton spec={findCameraSpec('lomo-instant-wide')!} />
        </Router>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(location.history).toEqual(['/catalog', '/']);
  });
});
