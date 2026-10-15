import * as v from 'valibot';

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
