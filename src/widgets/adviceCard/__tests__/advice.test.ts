import { createStore } from 'jotai';

import {
  describeNotes,
  describeSettings,
  describeStops,
  describeWarnings,
} from '../lib/describeAdvice';
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
    expect(describeStops(1)).toBe('1\u00A0ступень');
    expect(describeStops(2.12)).toBe('2,1\u00A0ступени');
    expect(describeStops(5)).toBe('5\u00A0ступеней');
    expect(describeStops(-0.91)).toBe('0,9\u00A0ступени');
  });

  it('просит выставить только то, что на камере крутится, включая режим', () => {
    const lomoAdvice = buildAdvice(measurementAt(16), lomoWide);
    const polaroid = createUserCameraFromSpec(findCameraSpec('polaroid-i-2')!, 3);
    const polaroidAdvice = buildAdvice(measurementAt(12), polaroid);

    expect(lomoAdvice.kind === 'ready' && describeSettings(lomoAdvice)).toEqual([
      { label: 'Режим', value: 'Автоматический', isWide: true },
      { label: 'Диафрагма', value: 'f/22' },
      { label: 'Коррекция', value: '0' },
      { label: 'Вспышка', value: 'Выключить' },
    ]);
    expect(polaroidAdvice.kind === 'ready' && describeSettings(polaroidAdvice)[0]).toEqual({
      label: 'Режим',
      value: 'Приоритет диафрагмы',
      isWide: true,
    });
  });

  it('показывает коррекцию в третях ступени, как на шкале камеры', () => {
    const lomoAdvice = buildAdvice(measurementAt(16), lomoWide);

    expect(lomoAdvice.kind).toBe('ready');
    if (lomoAdvice.kind === 'ready') {
      const withThirds = {
        ...lomoAdvice,
        recommendation: { ...lomoAdvice.recommendation, exposureCompensation: -5 / 3 },
      };
      expect(describeSettings(withThirds)).toContainEqual({ label: 'Коррекция', value: '−1 2/3' });
    }
  });

  it('у автоматической камеры нечего выставлять, выдержка и вспышка — справка', () => {
    const miniAdvice = buildAdvice(measurementAt(11), mini12);

    expect(miniAdvice.kind === 'ready' && describeSettings(miniAdvice)).toEqual([]);
    expect(miniAdvice.kind === 'ready' && describeNotes(miniAdvice)).toEqual([
      'Выдержку камера выберет сама — около 1/102 с, крутить её не нужно.',
      'Вспышкой управляет камера, она добивает на 0,3–2,2\u00A0м.',
    ]);
  });

  const warningsOf = (advice: ReturnType<typeof buildAdvice>) =>
    advice.kind === 'ready'
      ? describeWarnings(advice.recommendation.warnings, {
          residualError: advice.recommendation.residualError,
          filterThread: advice.filterThread,
          flashControllable: advice.flashControllable,
        })
      : [];

  it('говорит о пересвете прямо, с величиной и с действием', () => {
    expect(warningsOf(buildAdvice(measurementAt(16), lomoWide))).toEqual([
      {
        kind: 'shutter-ceiling',
        tone: 'warning',
        title: 'Кадр выйдет светлее нормы на 2,1\u00A0ступени',
        description:
          'Даже самой короткой выдержки камеры не хватит. Отойдите в тень или снимайте спиной к солнцу. Поможет и ND-фильтр — затемняющий фильтр на резьбу 49\u00A0мм.',
      },
      {
        kind: 'beyond-latitude',
        tone: 'danger',
        title: 'Не снимайте: кадр почти наверняка выйдет белым',
        description:
          'Ошибка больше, чем вытянет плёнка: 2,1\u00A0ступени. Лучше сменить сюжет или место.',
      },
    ]);
  });

  it('советует ND-фильтр только камере с резьбой под него', () => {
    const wide400 = createUserCameraFromSpec(findCameraSpec('instax-wide-400')!, 3);
    const descriptions = warningsOf(buildAdvice(measurementAt(16), wide400)).map(
      ({ description }) => description,
    );

    expect(descriptions.join(' ')).not.toContain('ND-фильтр');
  });

  it('не предлагает включить вспышку, если ею управляет камера', () => {
    const dark = warningsOf(buildAdvice(measurementAt(0), mini12));

    expect(dark.map(({ title }) => title)).toContain('Для этой камеры здесь слишком темно');
    expect(dark.find(({ kind }) => kind === 'shutter-floor')?.description).toContain(
      'вспышка добивает недалеко',
    );
    expect(dark.find(({ kind }) => kind === 'beyond-latitude')?.title).toBe(
      'Не снимайте: кадр почти наверняка выйдет тёмным',
    );
  });

  it('различает слишком светлую сцену для автоматической камеры', () => {
    expect(warningsOf(buildAdvice(measurementAt(15), mini12)).map(({ title }) => title)).toContain(
      'Для этой камеры здесь слишком светло',
    );
  });
});
