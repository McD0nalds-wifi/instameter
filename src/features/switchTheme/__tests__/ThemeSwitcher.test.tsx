import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';

import { ThemeSwitcher } from '../ui/ThemeSwitcher';

import { themePreferenceAtom } from '@/entities/preference';
import { setupUser } from '@/shared/lib/testing';

describe('ThemeSwitcher', () => {
  it('показывает текущую тему и сохраняет выбор пользователя', async () => {
    const user = setupUser();
    const store = createStore();
    store.set(themePreferenceAtom, 'system');

    render(
      <Provider store={store}>
        <ThemeSwitcher />
      </Provider>,
    );

    expect(screen.getByRole('radio', { name: 'Как в системе' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Тёмная' }));

    expect(store.get(themePreferenceAtom)).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Тёмная' })).toBeChecked();
  });
});
