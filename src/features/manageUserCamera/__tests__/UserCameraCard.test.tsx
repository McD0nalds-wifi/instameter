import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';

import { UserCameraCard } from '../ui/UserCameraCard';

import { findCameraSpec } from '@/entities/camera';
import { activeCameraAtom, createUserCameraFromSpec, userCamerasAtom } from '@/entities/userCamera';
import { setupUser } from '@/shared/lib/testing';

const lomo = createUserCameraFromSpec(findCameraSpec('lomo-instant-wide')!, 1);
const polaroid = createUserCameraFromSpec(findCameraSpec('polaroid-i-2')!, 2);

const renderCard = (cameraId: string) => {
  const store = createStore();
  store.set(userCamerasAtom, [lomo, polaroid]);
  const camera = store.get(userCamerasAtom).find(({ id }) => id === cameraId)!;
  render(
    <Provider store={store}>
      <UserCameraCard camera={camera} />
    </Provider>,
  );
  return store;
};

describe('UserCameraCard', () => {
  it('делает камеру активной и меняет заряженную плёнку', async () => {
    const user = setupUser();
    const store = renderCard(polaroid.id);

    expect(screen.getByRole('radio', { name: 'Polaroid i-Type' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Сделать активной' }));
    await user.click(screen.getByRole('radio', { name: 'Polaroid SX-70' }));

    expect(store.get(activeCameraAtom)?.id).toBe(polaroid.id);
    expect(store.get(activeCameraAtom)?.loadedFilmId).toBe('polaroid-sx-70');
  });

  it('у камеры с одной плёнкой показывает её без выбора и удаляет камеру', async () => {
    const user = setupUser();
    const store = renderCard(lomo.id);

    expect(screen.getByText('Активная')).toBeInTheDocument();
    expect(screen.getByText(/Fujifilm Instax Wide/)).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: "Удалить камеру Lomo'Instant Wide" }));

    expect(store.get(userCamerasAtom)).toEqual([polaroid]);
  });
});
