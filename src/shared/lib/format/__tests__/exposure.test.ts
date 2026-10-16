import { formatAperture, formatEv, formatShutter, formatStops, formatThirds } from '../exposure';

describe('форматирование экспозиции', () => {
  it('показывает выдержку дробью или секундами', () => {
    expect(formatShutter(1 / 250)).toBe('1/250 с');
    expect(formatShutter(1 / 135.2)).toBe('1/135 с');
    expect(formatShutter(2)).toBe('2 с');
    expect(formatShutter(1.8)).toBe('1,8 с');
  });

  it('показывает диафрагму, EV и ступени по-русски', () => {
    expect(formatAperture(12.7)).toBe('f/12,7');
    expect(formatAperture(8)).toBe('f/8');
    expect(formatEv(12.345)).toBe('12,3');
    expect(formatStops(-0.7)).toBe('−0,7');
    expect(formatStops(1)).toBe('+1');
    expect(formatStops(0)).toBe('0');
  });

  it('показывает поправку в третях ступени, как на шкале камеры', () => {
    expect(formatThirds(0)).toBe('0');
    expect(formatThirds(1 / 3)).toBe('+1/3');
    expect(formatThirds(-2 / 3)).toBe('−2/3');
    expect(formatThirds(1)).toBe('+1');
    expect(formatThirds(-4 / 3)).toBe('−1 1/3');
    expect(formatThirds(0.34)).toBe('+1/3');
  });
});
