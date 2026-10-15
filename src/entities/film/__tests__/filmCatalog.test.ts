import * as v from 'valibot';

import films from '../config/films.json';
import { findFilm } from '../model/filmCatalog';
import { FilmCatalogSchema } from '../model/filmSpec';

describe('каталог плёнок', () => {
  it('проходит схему', () => {
    const result = v.safeParse(FilmCatalogSchema, films);

    expect(result.issues && v.flatten(result.issues)).toBeUndefined();
  });

  it('не содержит повторяющихся id', () => {
    const ids = films.films.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('у каждой плёнки указан источник', () => {
    const withoutSource = films.films.filter(({ sourceUrl }) => !sourceUrl).map(({ id }) => id);

    expect(withoutSource).toEqual([]);
  });

  it('находит плёнку по id', () => {
    expect(findFilm('instax-wide')?.iso).toBe(800);
    expect(findFilm('unknown')).toBeUndefined();
  });
});
