import type { FC } from 'react';

import { Label, Radio, RadioGroup } from '@heroui/react';

import { findFilm } from '@/entities/film';
import { strings } from '@/shared/config';

type FilmSelectorProps = {
  filmIds: readonly string[];
  selectedFilmId: string;
  onChange: (filmId: string) => void;
};

export const FilmSelector: FC<FilmSelectorProps> = ({ filmIds, selectedFilmId, onChange }) => {
  const handleChange = (value: string) => {
    if (filmIds.includes(value)) {
      onChange(value);
    }
  };

  return (
    <RadioGroup value={selectedFilmId} onChange={handleChange} className="flex flex-col gap-1">
      <Label>{strings.userCamera.loadedFilmQuestion}</Label>
      {filmIds.map((filmId) => (
        <Radio key={filmId} value={filmId} className="flex min-h-11 flex-row items-center gap-3">
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content>
            <Label>{findFilm(filmId)?.name ?? filmId}</Label>
          </Radio.Content>
        </Radio>
      ))}
    </RadioGroup>
  );
};
