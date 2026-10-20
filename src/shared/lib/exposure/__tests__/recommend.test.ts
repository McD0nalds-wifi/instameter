import type { ExposureCamera, ExposureFilm, ExposureWarning } from '../recommend';

import {
  equivalentFocalLength,
  handheldShutterLimit,
  predictExposure,
  programAperture,
  programShutterRange,
  recommend,
} from '../recommend';

const instaxWide: ExposureFilm = { iso: 800, frameSize: [62, 99], latitudeStops: null };

const instaxMini: ExposureFilm = { iso: 800, frameSize: [62, 46], latitudeStops: null };

const lomoInstantWide: ExposureCamera = {
  focalLength: 90,
  apertures: [8, 22],
  shutter: [
    { kind: 'program', fastest: 1 / 250, slowest: 8 },
    { kind: 'fixed', values: [1 / 30] },
    { kind: 'bulb' },
  ],
  exposureCompensation: [-1, 0, 1],
  flash: { canDisable: true },
};

const instaxMini12: ExposureCamera = {
  focalLength: 60,
  apertures: [],
  effectiveAperture: 12.7,
  shutter: [{ kind: 'program', fastest: 1 / 250, slowest: 0.5 }],
  exposureCompensation: [],
  flash: { canDisable: false },
  meteringRange: { minLv: 5, maxLv: 14.5, iso: 800 },
};

const warningKinds = (warnings: ExposureWarning[]) => warnings.map(({ kind }) => kind);

const shutterDenominator = (seconds: number) => Math.round(1 / seconds);

describe('вспомогательные расчёты', () => {
  it('считает эквивалентное фокусное и порог смаза', () => {
    expect(equivalentFocalLength(90, instaxWide.frameSize)).toBeCloseTo(33.3, 1);
    expect(handheldShutterLimit(lomoInstantWide, instaxWide)).toBeCloseTo(1 / 60);
  });

  it('берёт границы автоматики только из программных режимов затвора', () => {
    expect(programShutterRange(lomoInstantWide.shutter)).toEqual({ fastest: 1 / 250, slowest: 8 });
    expect(programShutterRange([{ kind: 'bulb' }])).toBeUndefined();
  });
});

describe('predictExposure', () => {
  const range = { fastest: 1 / 250, slowest: 8 };

  it('экспокоррекция в минус не меняет ошибку, когда затвор упёрся в потолок', () => {
    const neutral = predictExposure(16, 22, 0, 800, range);
    const minusOne = predictExposure(16, 22, -1, 800, range);

    expect(neutral.predictedShutter).toBeCloseTo(1 / 250);
    expect(minusOne.predictedShutter).toBeCloseTo(1 / 250);
    expect(minusOne.residualError).toBe(neutral.residualError);
    expect(neutral.residualError).toBeCloseTo(2.12, 2);
  });

  it('без клампа экспокоррекция сдвигает экспозицию ровно на свою величину', () => {
    expect(predictExposure(12, 22, 1, 800, range).residualError).toBeCloseTo(1);
    expect(predictExposure(12, 22, -1, 800, range).residualError).toBeCloseTo(-1);
  });
});

describe('recommend: эталонный прогон Lomo’Instant Wide с Instax Wide', () => {
  it.each([
    {
      ev100: 16,
      aperture: 22,
      compensation: 0,
      shutter: 250,
      residual: 2.12,
      warnings: ['shutter-ceiling', 'beyond-latitude'],
    },
    {
      ev100: 15,
      aperture: 22,
      compensation: 0,
      shutter: 250,
      residual: 1.12,
      warnings: ['shutter-ceiling', 'beyond-latitude'],
    },
    { ev100: 14, aperture: 22, compensation: 0, shutter: 250, residual: 0.12, warnings: [] },
    { ev100: 13, aperture: 22, compensation: 0, shutter: 135, residual: 0, warnings: [] },
    { ev100: 12, aperture: 22, compensation: 0, shutter: 68, residual: 0, warnings: [] },
    { ev100: 10, aperture: 8, compensation: 0, shutter: 128, residual: 0, warnings: [] },
    { ev100: 8, aperture: 8, compensation: -1, shutter: 64, residual: -1, warnings: [] },
    { ev100: 6, aperture: 8, compensation: -1, shutter: 16, residual: -1, warnings: ['blur-risk'] },
  ])(
    'EV₁₀₀ $ev100 → f/$aperture, коррекция $compensation, 1/$shutter',
    ({ ev100, aperture, compensation, shutter, residual, warnings }) => {
      const result = recommend(ev100, lomoInstantWide, instaxWide);

      expect(result.aperture).toBe(aperture);
      expect(result.exposureCompensation).toBe(compensation);
      expect(shutterDenominator(result.predictedShutter)).toBe(shutter);
      expect(result.residualError).toBeCloseTo(residual, 2);
      expect(warningKinds(result.warnings)).toEqual(warnings);
    },
  );

  it('в комнате вечером советует вспышку, в сумерках — нет', () => {
    expect(recommend(6, lomoInstantWide, instaxWide).flash).toBe('on');
    expect(recommend(8, lomoInstantWide, instaxWide).flash).toBe('off');
    expect(recommend(12, lomoInstantWide, instaxWide).flash).toBe('off');
  });

  it('объясняет выбор кодом причины', () => {
    expect(recommend(16, lomoInstantWide, instaxWide).rationale).toBe('least-overexposure');
    expect(recommend(13, lomoInstantWide, instaxWide).rationale).toBe('exact');
    expect(recommend(8, lomoInstantWide, instaxWide).rationale).toBe('least-underexposure');

    const withoutCompensation = { ...lomoInstantWide, exposureCompensation: [] };
    expect(recommend(8, withoutCompensation, instaxWide).rationale).toBe('least-blur');
  });

  it('со штатива не штрафует за смаз и узкую диафрагму', () => {
    const result = recommend(8, lomoInstantWide, instaxWide, {
      defaultLatitudeStops: 1,
      handheld: false,
    });

    expect(result.exposureCompensation).toBe(0);
    expect(result.predictedShutter).toBeCloseTo(1 / 32);
    expect(result.blurStops).toBe(0);
    expect(result.warnings).toEqual([]);
    expect(result.flash).toBe('off');
  });

  it('берёт широту плёнки из спеки, если она указана', () => {
    const tolerantFilm = { ...instaxWide, latitudeStops: 2.5 };

    expect(warningKinds(recommend(16, lomoInstantWide, tolerantFilm).warnings)).toEqual([
      'shutter-ceiling',
    ]);
  });
});

describe('recommend: автоматическая камера Instax Mini 12', () => {
  it('не советует настроек и предупреждает о выходе за рабочий диапазон', () => {
    const result = recommend(15, instaxMini12, instaxMini);

    expect(result.aperture).toBeNull();
    expect(result.exposureCompensation).toBeNull();
    expect(result.flash).toBe('camera-decides');
    expect(result.rationale).toBe('fixed-settings');
    expect(result.residualError).toBeCloseTo(2.7, 1);
    expect(result.warnings).toContainEqual({ kind: 'outside-metering-range', stops: 3.5 });
  });

  it('внутри рабочего диапазона ничего не предупреждает', () => {
    const result = recommend(11, instaxMini12, instaxMini);

    expect(result.residualError).toBeCloseTo(0);
    expect(result.warnings).toEqual([]);
  });
});

describe('recommend: неподдерживаемая камера', () => {
  it('падает с понятной ошибкой без программного затвора', () => {
    const bulbOnly = { ...lomoInstantWide, shutter: [{ kind: 'bulb' as const }] };

    expect(() => recommend(12, bulbOnly, instaxWide)).toThrow('программного режима');
  });
});

describe('программная диафрагма', () => {
  const lomoProgram: ExposureCamera = {
    ...lomoInstantWide,
    apertures: [],
    programApertures: [8, 22],
  };
  const range = { fastest: 1 / 250, slowest: 8 };

  it('держит самую открытую диафрагму, пока выдержка не упрётся в потолок', () => {
    expect(programAperture(10, [22, 8], 0, 800, range)).toBe(8);
    expect(programAperture(12, [8, 22], 0, 800, range)).toBe(22);
    expect(programAperture(16, [8, 22], 0, 800, range)).toBe(22);
  });

  it.each([
    { ev100: 16, aperture: 22, compensation: 0, shutter: 250, residual: 2.12 },
    { ev100: 15, aperture: 22, compensation: 0, shutter: 250, residual: 1.12 },
    { ev100: 13, aperture: 22, compensation: 0, shutter: 135, residual: 0 },
    { ev100: 12, aperture: 22, compensation: 0, shutter: 68, residual: 0 },
    { ev100: 10, aperture: 8, compensation: 0, shutter: 128, residual: 0 },
    { ev100: 8, aperture: 8, compensation: -1, shutter: 64, residual: -1 },
    { ev100: 6, aperture: 8, compensation: -1, shutter: 16, residual: -1 },
  ])(
    'Lomo’Instant Wide на EV₁₀₀ $ev100 сама выбирает f/$aperture, совет — коррекция $compensation',
    ({ ev100, aperture, compensation, shutter, residual }) => {
      const result = recommend(ev100, lomoProgram, instaxWide);

      expect(result.aperture).toBeNull();
      expect(result.predictedAperture).toBe(aperture);
      expect(result.exposureCompensation).toBe(compensation);
      expect(shutterDenominator(result.predictedShutter)).toBe(shutter);
      expect(result.residualError).toBeCloseTo(residual, 2);
    },
  );
});

describe('вспышка Instax Mini 99 при коррекции', () => {
  const mini99: ExposureCamera = {
    focalLength: 60,
    apertures: [],
    effectiveAperture: 12.7,
    shutter: [{ kind: 'program', fastest: 1 / 400, slowest: 1.8 }],
    exposureCompensation: [-5 / 3, -2 / 3, 0, 2 / 3, 1],
    flash: { canDisable: true, offOnlyAtZeroCompensation: true },
  };

  it('не советует выключить вспышку при ненулевой коррекции — только «Авто»', () => {
    const result = recommend(9.8, mini99, instaxMini);

    expect(result.exposureCompensation).toBeCloseTo(-2 / 3);
    expect(result.blurStops).toBe(0);
    expect(result.flash).toBe('camera-decides');
  });

  it('при нулевой коррекции вспышку выключить можно', () => {
    expect(recommend(13, mini99, instaxMini)).toMatchObject({
      exposureCompensation: 0,
      flash: 'off',
    });
  });
});

describe('поправка на замер камеры по всему кадру', () => {
  const lomoProgram: ExposureCamera = {
    ...lomoInstantWide,
    apertures: [],
    programApertures: [8, 22],
  };

  it('светлое лицо на тёмном фоне: камера пересветила бы, совет — коррекция −1', () => {
    const withoutBias = recommend(10.4, lomoProgram, instaxWide);
    const withBias = recommend(10.4, lomoProgram, instaxWide, {
      defaultLatitudeStops: 1,
      handheld: true,
      meteringBias: -1,
    });

    expect(withoutBias.exposureCompensation).toBe(0);
    expect(withBias.exposureCompensation).toBe(-1);
    expect(withBias.residualError).toBeCloseTo(0, 1);
  });

  it('без коррекции на камере предсказывает пересвет объекта', () => {
    const fixedCamera: ExposureCamera = { ...lomoProgram, exposureCompensation: [] };
    const result = recommend(10.4, fixedCamera, instaxWide, {
      defaultLatitudeStops: 1,
      handheld: true,
      meteringBias: -1,
    });

    expect(result.residualError).toBeCloseTo(1, 1);
  });

  it('мелкую разницу меньше трети ступени не учитывает', () => {
    const result = recommend(10.4, lomoProgram, instaxWide, {
      defaultLatitudeStops: 1,
      handheld: true,
      meteringBias: -0.2,
    });

    expect(result.exposureCompensation).toBe(0);
    expect(result.residualError).toBeCloseTo(0);
  });
});
