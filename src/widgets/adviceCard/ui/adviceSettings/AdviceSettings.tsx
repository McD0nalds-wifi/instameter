import type { SettingRow } from '../../lib/describeAdvice';
import type { FC } from 'react';

import { Typography } from '@heroui/react';

type AdviceSettingsProps = {
  rows: SettingRow[];
};

export const AdviceSettings: FC<AdviceSettingsProps> = ({ rows }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
    {rows.map(({ label, value, isWide }) => (
      <div
        key={label}
        className={
          isWide ? 'col-span-2 flex min-w-0 flex-col gap-0.5' : 'flex min-w-0 flex-col gap-0.5'
        }
      >
        <dt>
          <Typography type="body-sm" className="text-muted">
            {label}
          </Typography>
        </dt>
        <dd>
          <Typography type="h3" className="break-words">
            {value}
          </Typography>
        </dd>
      </div>
    ))}
  </dl>
);
