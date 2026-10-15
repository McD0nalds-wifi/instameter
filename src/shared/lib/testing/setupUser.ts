import type { Options } from '@testing-library/user-event';

import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';

export const setupUser = (options: Options = {}) =>
  userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never, ...options });
