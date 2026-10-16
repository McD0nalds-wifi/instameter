import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

import { BottomNavigation } from '../ui/bottomNavigation/BottomNavigation';

describe('BottomNavigation', () => {
  it('отмечает текущий раздел не только цветом, но и для скринридера', () => {
    const location = memoryLocation({ path: '/cameras' });

    render(
      <Router hook={location.hook}>
        <BottomNavigation />
      </Router>,
    );

    expect(screen.getByRole('link', { name: 'Мои камеры' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Замер' })).not.toHaveAttribute('aria-current');
  });
});
