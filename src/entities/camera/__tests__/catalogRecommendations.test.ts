import { cameraCatalog } from '../model/cameraCatalog';

import { filmCatalog } from '@/entities/film/@x/camera';
import { recommend } from '@/shared/lib/exposure';

const sceneRange = Array.from({ length: 19 }, (_, index) => index);

const cameraFilmPairs = cameraCatalog.cameras.flatMap((camera) =>
  camera.filmIds.flatMap((filmId) => {
    const film = filmCatalog.films.find(({ id }) => id === filmId);
    return film ? [{ camera, film }] : [];
  }),
);

describe('движок на всём каталоге', () => {
  it.each(cameraFilmPairs.map(({ camera, film }) => [camera.id, film.id, camera, film] as const))(
    '%s с плёнкой %s даёт допустимый совет на EV₁₀₀ от 0 до 18',
    (_cameraId, _filmId, camera, film) => {
      sceneRange.forEach((ev100) => {
        const result = recommend(ev100, camera, film);

        expect(Number.isFinite(result.residualError)).toBe(true);
        expect(result.predictedShutter).toBeGreaterThan(0);
        expect(result.aperture === null || camera.apertures.includes(result.aperture)).toBe(true);
        expect(
          result.exposureCompensation === null ||
            camera.exposureCompensation.includes(result.exposureCompensation),
        ).toBe(true);
      });
    },
  );
});
