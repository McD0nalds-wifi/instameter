import * as v from 'valibot';

import { describeScene } from '../lib/describeScene';
import { createExifMeasurement, MeasurementSchema } from '../model/measurement';

describe('createExifMeasurement', () => {
  const exposure = { exposureTime: 1 / 125, fNumber: 16, iso: 100, exposureBias: 0 };

  it('считает EV сцены и помечает источник и уверенность', () => {
    const measurement = createExifMeasurement(exposure, 0, 1000);

    expect(measurement.ev100).toBeCloseTo(14.97, 2);
    expect(measurement).toMatchObject({
      source: 'exif',
      confidence: 'high',
      at: 1000,
      exif: exposure,
    });
    expect(v.is(MeasurementSchema, measurement)).toBe(true);
  });

  it('учитывает постоянную поправку устройства', () => {
    expect(createExifMeasurement(exposure, -0.5).ev100).toBeCloseTo(14.47, 2);
  });
});

describe('describeScene', () => {
  it('называет сцену словами по эталонной шкале', () => {
    expect(describeScene(16)).toBe('Снег или пляж в яркий полдень');
    expect(describeScene(15)).toBe('Яркое солнце');
    expect(describeScene(14)).toBe('Солнце в лёгкой дымке');
    expect(describeScene(13)).toBe('Лёгкая облачность');
    expect(describeScene(12)).toBe('Пасмурно');
    expect(describeScene(10)).toBe('Глубокая тень или густые тучи');
    expect(describeScene(8)).toBe('Сумерки');
    expect(describeScene(6)).toBe('Комната вечером');
    expect(describeScene(2)).toBe('Очень темно');
  });
});
