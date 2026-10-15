import { formatAperture, formatEv, formatShutter, formatStops } from '../exposure';

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
});
