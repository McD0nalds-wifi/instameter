import type { FilmCatalog, FilmSpec } from './filmSpec';

import films from '../config/films.json';

export const filmCatalog = films as FilmCatalog;

export const findFilm = (id: string): FilmSpec | undefined =>
  filmCatalog.films.find((film) => film.id === id);
