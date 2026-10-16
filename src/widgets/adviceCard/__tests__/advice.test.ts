import { createStore } from 'jotai';

import { describeSettings, describeStops, describeWarnings } from '../lib/describeAdvice';
import { buildAdvice } from '../model/advice';
import { adviceAtom } from '../model/atoms';

import { findCameraSpec } from '@/entities/camera';
import { createExifMeasurement, currentMeasurementAtom } from '@/entities/measurement';
import {
  activeCameraIdAtom,
  createUserCameraFromSpec,
  userCamerasAtom,
} from '@/entities/userCamera';

const measurementAt = (ev100: number) => ({
  ev100,
  source: 'exif' as const,
  confidence: 'high' as const,
  at: 0,
});

const lomoWide = createUserCameraFromSpec(findCameraSpec('lomo-instant-wide')!, 1);
const mini12 = createUserCameraFromSpec(findCameraSpec('instax-mini-12')!, 2);

describe('buildAdvice', () => {
  it('без камеры просит её выбрать, без замера — ждёт замер', () => {
    expect(buildAdvice(measurementAt(12), null)).toEqual({ kind: 'no-camera' });
    expect(buildAdvice(null, lomoWide)).toEqual({ kind: 'no-measurement' });
  });

  it('считает совет для активной камеры и заряженной плёнки', () => {
    const advice = buildAdvice(measurementAt(15), lomoWide);

    expect(advice).toMatchObject({
      kind: 'ready',
      cameraName: "Lomo'Instant Wide",
      filmName: 'Fujifilm Instax Wide',
      recommendation: { aperture: 22, rationale: 'least-overexposure' },
    });
  });

  it('не падает на камере без программного затвора', () => {
    const bulbOnly = {
      ...lomoWide,
      specId: null,
      customSpec: { ...findCameraSpec('lomo-instant-wide')!, shutter: [{ kind: 'bulb' as const }] },
    };

    expect(buildAdvice(measurementAt(12), bulbOnly)).toEqual({
      kind: 'unsupported-camera',
      cameraName: "Lomo'Instant Wide",
    });
  });
});

describe('adviceAtom', () => {
  it('пересчитывает совет по тому же замеру при смене активной камеры', () => {
    const store = createStore();
    store.set(userCamerasAtom, [lomoWide, mini12]);
    store.set(
      currentMeasurementAtom,
      createExifMeasurement({ exposureTime: 1 / 250, fNumber: 16, iso: 100 }, 0),
    );

    store.set(activeCameraIdAtom, lomoWide.id);
    expect(store.get(adviceAtom)).toMatchObject({ recommendation: { aperture: 22 } });

    store.set(activeCameraIdAtom, mini12.id);
    expect(store.get(adviceAtom)).toMatchObject({
      cameraName: 'Instax Mini 12',
      recommendation: { aperture: null, rationale: 'fixed-settings' },
    });
  });
});

describe('тексты совета', () => {
  it('склоняет ступени и округляет до десятых', () => {
    expect(describeStops(1)).toBe('1 ступень');
    expect(describeStops(2.12)).toBe('2,1 ступени');
    expect(describeStops(5)).toBe('5 ступеней');
    expect(describeStops(-0.91)).toBe('0,9 ступени');
  });

  it('показывает только те настройки, которые на камере есть', () => {
    const lomoAdvice = buildAdvice(measurementAt(16), lomoWide);
    const miniAdvice = buildAdvice(measurementAt(11), mini12);

    expect(lomoAdvice.kind === 'ready' && describeSettings(lomoAdvice.recommendation)).toEqual([
      { label: 'Диафрагма', value: 'f/22' },
      { label: 'Коррекция', value: '0' },
      { label: 'Вспышка', value: 'Выключить' },
      { label: 'Камера выберет выдержку', value: '1/250 с' },
    ]);
    expect(miniAdvice.kind === 'ready' && describeSettings(miniAdvice.recommendation)).toEqual([
      { label: 'Вспышка', value: 'Решает камера' },
      { label: 'Камера выберет выдержку', value: '1/102 с' },
    ]);
  });

  it('говорит о пересвете прямо и с величиной', () => {
    const advice = buildAdvice(measurementAt(16), lomoWide);
    const warnings =
      advice.kind === 'ready' ? describeWarnings(advice.recommendation.warnings) : [];

    expect(warnings).toEqual([
      expect.objectContaining({
        kind: 'shutter-ceiling',
        tone: 'warning',
        title: 'Пересвет на 2,1 ступени',
      }),
      expect.objectContaining({
        kind: 'beyond-latitude',
        tone: 'danger',
        description: 'Ошибка экспозиции больше, чем вытянет плёнка: 2,1 ступени.',
      }),
    ]);
  });

  it('различает слишком светлую и слишком тёмную сцену для автоматической камеры', () => {
    const bright = buildAdvice(measurementAt(15), mini12);
    const dark = buildAdvice(measurementAt(0), mini12);
    const titles = (advice: typeof bright) =>
      advice.kind === 'ready'
        ? describeWarnings(advice.recommendation.warnings).map(({ title }) => title)
        : [];

    expect(titles(bright)).toContain('Слишком светло для этой камеры');
    expect(titles(dark)).toContain('Слишком темно для этой камеры');
  });
});
