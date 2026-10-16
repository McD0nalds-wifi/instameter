import { render, screen, within } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

import { AdviceCard } from '../ui/AdviceCard';

import { findCameraSpec } from '@/entities/camera';
import { currentMeasurementAtom } from '@/entities/measurement';
import { createUserCameraFromSpec, userCamerasAtom } from '@/entities/userCamera';
import { setupUser } from '@/shared/lib/testing';

const renderAdvice = (store = createStore()) => {
  const location = memoryLocation({ path: '/', record: true });
  render(
    <Provider store={store}>
      <Router hook={location.hook}>
        <AdviceCard />
      </Router>
    </Provider>,
  );
  return location;
};

describe('AdviceCard', () => {
  it('на снегу предупреждает о пересвете, а диафрагму оставляет камере', () => {
    const store = createStore();
    store.set(userCamerasAtom, [createUserCameraFromSpec(findCameraSpec('lomo-instant-wide')!, 1)]);
    store.set(currentMeasurementAtom, { ev100: 16, source: 'exif', confidence: 'high', at: 0 });

    renderAdvice(store);

    const card = screen.getByLabelText("Совет для Lomo'Instant Wide");
    expect(within(card).getByText("Lomo'Instant Wide")).toBeInTheDocument();
    expect(within(card).getByText('Fujifilm Instax Wide')).toBeInTheDocument();
    expect(within(card).queryByText('Диафрагма')).not.toBeInTheDocument();
    expect(within(card).getByText('Выставьте на камере')).toBeInTheDocument();
    expect(within(card).getByText('Автоматический')).toBeInTheDocument();
    expect(
      within(card).getByText(/около f\/22 и 1\/250 с, крутить их не нужно/),
    ).toBeInTheDocument();
    expect(within(card).getByText(/пересвечен меньше всего/)).toBeInTheDocument();
    expect(within(card).getByText('Кадр выйдет светлее нормы на 2,1 ступени')).toBeInTheDocument();
    expect(
      within(card).getByText('Не снимайте: кадр почти наверняка выйдет белым'),
    ).toBeInTheDocument();
  });

  it('без камеры предлагает открыть каталог', async () => {
    const user = setupUser();
    const location = renderAdvice();

    await user.click(screen.getByRole('button', { name: 'Открыть каталог' }));

    expect(location.history).toEqual(['/', '/catalog']);
  });

  it('с камерой, но без замера ничего не показывает', () => {
    const store = createStore();
    store.set(userCamerasAtom, [createUserCameraFromSpec(findCameraSpec('instax-mini-12')!, 1)]);

    renderAdvice(store);

    expect(screen.queryByLabelText(/^Совет для/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
