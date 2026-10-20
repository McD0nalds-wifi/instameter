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

describe('Lomo’Instant Wide Glass', () => {
  const glass = cameraCatalog.cameras.find(({ id }) => id === 'lomo-instant-wide-glass')!;
  const instaxWide = filmCatalog.films.find(({ id }) => id === 'instax-wide')!;

  it('отличается от обычной Wide резьбой, зонами фокуса и пределом Bulb', () => {
    expect(glass.filterThread).toBe(52);
    expect(glass.focusZones?.map(({ label }) => label)).toEqual(['0,3 м', '0,6 м', '1–2 м', '∞']);
    expect(glass.shutter).toContainEqual({ kind: 'bulb', maxSeconds: 30 });
    expect(glass.programApertures).toEqual([8, 22]);
  });

  it('в тени на EV₁₀₀ 10,4 камера сама выберет f/8 около 1/174 с, коррекция 0', () => {
    const result = recommend(10.4, glass, instaxWide);

    expect(result.aperture).toBeNull();
    expect(result.predictedAperture).toBe(8);
    expect(Math.round(1 / result.predictedShutter)).toBe(169);
    expect(result.exposureCompensation).toBe(0);
  });
});
