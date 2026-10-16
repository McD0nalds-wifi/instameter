import type { CameraSpec } from '../model/cameraSpec';

import * as v from 'valibot';

import cameras from '../config/cameras.json';
import { cameraCatalog, findCameraSpec } from '../model/cameraCatalog';
import { CameraCatalogSchema, CameraSpecSchema } from '../model/cameraSpec';

import { filmCatalog } from '@/entities/film/@x/camera';

const isAutomatic = ({ apertures, exposureCompensation }: CameraSpec) =>
  apertures.length === 0 && exposureCompensation.length === 0;

const isPartial = ({ apertures, exposureCompensation }: CameraSpec) =>
  apertures.length === 0 && exposureCompensation.length > 0;

const isManual = ({ apertures }: CameraSpec) => apertures.length > 2;

describe('каталог камер', () => {
  it('проходит схему', () => {
    const result = v.safeParse(CameraCatalogSchema, cameras);

    expect(result.issues && v.flatten(result.issues)).toBeUndefined();
  });

  it('не содержит повторяющихся id', () => {
    const ids = cameraCatalog.cameras.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ссылается только на существующие плёнки', () => {
    const filmIds = new Set(filmCatalog.films.map(({ id }) => id));
    const brokenLinks = cameraCatalog.cameras.flatMap(({ id, filmIds: cameraFilmIds }) =>
      cameraFilmIds.filter((filmId) => !filmIds.has(filmId)).map((filmId) => `${id} → ${filmId}`),
    );

    expect(brokenLinks).toEqual([]);
  });

  it('у каждой камеры указан источник', () => {
    const withoutSource = cameraCatalog.cameras
      .filter(({ sourceUrl }) => !sourceUrl)
      .map(({ id }) => id);

    expect(withoutSource).toEqual([]);
  });

  it('перекрывает все три класса управления', () => {
    expect(cameraCatalog.cameras.some(isAutomatic)).toBe(true);
    expect(cameraCatalog.cameras.some(isPartial)).toBe(true);
    expect(cameraCatalog.cameras.some(isManual)).toBe(true);
  });

  it('находит камеру по id', () => {
    expect(findCameraSpec('lomo-instant-wide')?.filmIds).toEqual(['instax-wide']);
    expect(findCameraSpec('lomo-instant-wide')?.programApertures).toEqual([8, 22]);
    expect(findCameraSpec('unknown')).toBeUndefined();
  });
});

describe('CameraSpecSchema', () => {
  const [baseSpec] = cameraCatalog.cameras;

  it('отклоняет камеру без диафрагмы и без effectiveAperture', () => {
    const spec = {
      ...baseSpec,
      apertures: [],
      effectiveAperture: undefined,
      programApertures: undefined,
    };

    expect(v.is(CameraSpecSchema, spec)).toBe(false);
  });

  it('отклоняет программный затвор с перепутанными границами', () => {
    const spec = { ...baseSpec, shutter: [{ kind: 'program', fastest: 1, slowest: 1 / 500 }] };

    expect(v.is(CameraSpecSchema, spec)).toBe(false);
  });
});
