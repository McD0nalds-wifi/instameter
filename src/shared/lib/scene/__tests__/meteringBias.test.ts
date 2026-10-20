import type { PixelGrid, Region } from '../meteringBias';

import { estimateMeteringBias } from '../meteringBias';

const linearToSrgb = (value: number) => {
  const encoded = value <= 0.003_130_8 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(Math.max(encoded, 0), 1) * 255);
};

const gridFromLuminance = (
  width: number,
  height: number,
  luminanceAt: (u: number, v: number) => number,
): PixelGrid => ({
  width,
  height,
  data: Array.from({ length: width * height }).flatMap((_, index) => {
    const u = ((index % width) + 0.5) / width;
    const v = (Math.floor(index / width) + 0.5) / height;
    const channel = linearToSrgb(luminanceAt(u, v));
    return [channel, channel, channel, 255];
  }),
});

const subject: Region = { x: 0.4, y: 0.3, width: 0.2, height: 0.2 };
const inSubject = (u: number, v: number) => u >= 0.4 && u <= 0.6 && v >= 0.3 && v <= 0.5;

describe('estimateMeteringBias', () => {
  it('на равномерной сцене камера меряет так же, как телефон', () => {
    const estimate = estimateMeteringBias(
      gridFromLuminance(32, 32, () => 0.18),
      subject,
    );

    expect(estimate?.biasStops).toBeCloseTo(0, 1);
  });

  it('светлое лицо на тёмном фоне: камера увидит сцену темнее на ступени', () => {
    const grid = gridFromLuminance(48, 64, (u, v) => (inSubject(u, v) ? 0.36 : 0.09));
    const estimate = estimateMeteringBias(grid, subject);

    expect(estimate?.biasStops).toBeLessThan(-1.2);
    expect(estimate?.biasStops).toBeGreaterThan(-2.1);
  });

  it('тёмный объект на светлом фоне: камера увидит сцену светлее', () => {
    const grid = gridFromLuminance(48, 64, (u, v) => (inSubject(u, v) ? 0.05 : 0.4));

    expect(estimateMeteringBias(grid, subject)?.biasStops).toBeGreaterThan(1.5);
  });

  it('ограничивает оценку тремя ступенями', () => {
    const grid = gridFromLuminance(32, 32, (u, v) => (inSubject(u, v) ? 0.9 : 0.0005));

    expect(estimateMeteringBias(grid, subject)?.biasStops).toBe(-3);
  });

  it('без пикселей в области объекта оценки нет', () => {
    const grid = gridFromLuminance(4, 4, () => 0.18);

    expect(
      estimateMeteringBias(grid, { x: 0.41, y: 0.41, width: 0.01, height: 0.01 }),
    ).toBeUndefined();
  });
});
