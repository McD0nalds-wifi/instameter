import type { FC } from 'react';
import type { Selection } from 'react-aria-components';

import { Label, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useId } from 'react';

import {
  isThemePreference,
  saveThemePreferenceAtom,
  THEME_PREFERENCES,
  themePreferenceAtom,
} from '@/entities/preference';
import { strings } from '@/shared/config';

const themeIcons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

export const ThemeSwitcher: FC = () => {
  const labelId = useId();
  const preference = useAtomValue(themePreferenceAtom);
  const savePreference = useSetAtom(saveThemePreferenceAtom);

  const handleSelectionChange = (selection: Selection) => {
    const [selected] = selection === 'all' ? [] : [...selection];

    if (isThemePreference(selected)) {
      void savePreference(selected);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId}>{strings.theme.label}</Label>
      <ToggleButtonGroup
        aria-labelledby={labelId}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[preference]}
        onSelectionChange={handleSelectionChange}
        fullWidth
      >
        {THEME_PREFERENCES.map((option) => {
          const Icon = themeIcons[option];
          return (
            <ToggleButton key={option} id={option}>
              <Icon aria-hidden size={18} />
              {strings.theme[option]}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </div>
  );
};
