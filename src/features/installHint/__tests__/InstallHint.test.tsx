import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';

import { InstallHint } from '../ui/InstallHint';

import { installHintDismissedAtom } from '@/entities/preference';
import { setupUser } from '@/shared/lib/testing';

const iphoneUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1';

const renderHint = (store = createStore()) => {
  render(
    <Provider store={store}>
      <InstallHint />
    </Provider>,
  );
  return store;
};

describe('InstallHint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('на iPhone в браузере объясняет установку и скрывается навсегда', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(iphoneUserAgent);
    const user = setupUser();
    const store = renderHint();

    expect(screen.getByText('Установите Instameter на экран «Домой»')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Скрыть подсказку' }));

    expect(store.get(installHintDismissedAtom)).toBe(true);
    expect(screen.queryByText('Установите Instameter на экран «Домой»')).not.toBeInTheDocument();
  });

  it('не показывается в установленном приложении, после скрытия и не на iOS', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(iphoneUserAgent);
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    renderHint();
    expect(screen.queryByRole('button', { name: 'Скрыть подсказку' })).not.toBeInTheDocument();

    vi.restoreAllMocks();
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(iphoneUserAgent);
    const dismissedStore = createStore();
    dismissedStore.set(installHintDismissedAtom, true);
    renderHint(dismissedStore);
    expect(screen.queryByRole('button', { name: 'Скрыть подсказку' })).not.toBeInTheDocument();

    vi.restoreAllMocks();
    renderHint();
    expect(screen.queryByRole('button', { name: 'Скрыть подсказку' })).not.toBeInTheDocument();
  });
});
