import { lvToEv100, sceneEv100 } from '../ev';

describe('sceneEv100', () => {
  it('считает EV по экспопаре при ISO 100', () => {
    expect(sceneEv100({ exposureTime: 1, fNumber: 1, iso: 100 })).toBe(0);
    expect(sceneEv100({ exposureTime: 1 / 125, fNumber: 16, iso: 100 })).toBeCloseTo(14.97, 2);
  });

  it('приводит экспопару к ISO 100', () => {
    expect(sceneEv100({ exposureTime: 1 / 125, fNumber: 16, iso: 200 })).toBeCloseTo(13.97, 2);
    expect(sceneEv100({ exposureTime: 1 / 120, fNumber: 1.78, iso: 32 })).toBeCloseTo(10.21, 2);
  });

  it('возвращает экспокоррекцию телефона обратно к замеру сцены', () => {
    const settings = { exposureTime: 1 / 60, fNumber: 2, iso: 100 };

    expect(sceneEv100({ ...settings, exposureBias: 1 }) - sceneEv100(settings)).toBeCloseTo(1);
    expect(sceneEv100({ ...settings, exposureBias: -0.7 }) - sceneEv100(settings)).toBeCloseTo(
      -0.7,
    );
  });

  it('прибавляет постоянную поправку устройства', () => {
    const settings = { exposureTime: 1 / 60, fNumber: 2, iso: 100 };

    expect(sceneEv100(settings, -0.5) - sceneEv100(settings)).toBeCloseTo(-0.5);
  });
});

describe('lvToEv100', () => {
  it('пересчитывает Lv при ISO 800 в EV₁₀₀', () => {
    expect(lvToEv100(15, 800)).toBe(12);
    expect(lvToEv100(14.5, 800)).toBe(11.5);
    expect(lvToEv100(10, 100)).toBe(10);
  });
});
