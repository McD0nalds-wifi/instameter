import { pluralize } from '../pluralize';

const stops = { one: 'ступень', few: 'ступени', many: 'ступеней', other: 'ступени' };

describe('pluralize', () => {
  it('выбирает форму для целых чисел по правилам русского языка', () => {
    expect(pluralize(1, stops)).toBe('ступень');
    expect(pluralize(2, stops)).toBe('ступени');
    expect(pluralize(5, stops)).toBe('ступеней');
    expect(pluralize(11, stops)).toBe('ступеней');
    expect(pluralize(21, stops)).toBe('ступень');
    expect(pluralize(22, stops)).toBe('ступени');
  });

  it('для дробных значений берёт форму other', () => {
    expect(pluralize(1.5, stops)).toBe('ступени');
    expect(pluralize(0.3, stops)).toBe('ступени');
  });
});
