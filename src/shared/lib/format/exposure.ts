const stopsFormat = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

const evFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

const apertureFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

export const formatEv = (ev: number): string => evFormat.format(ev);

export const formatStops = (stops: number): string => stopsFormat.format(stops).replace('-', '−');

export const formatAperture = (aperture: number): string => `f/${apertureFormat.format(aperture)}`;

export const formatShutter = (seconds: number): string => {
  if (seconds >= 1) {
    return `${evFormat.format(seconds)} с`;
  }
  return `1/${Math.round(1 / seconds)} с`;
};

const formatWholeAndThirds = (whole: number, thirds: number) => {
  if (whole === 0) {
    return `${thirds}/3`;
  }
  return thirds === 0 ? `${whole}` : `${whole} ${thirds}/3`;
};

export const formatThirds = (stops: number): string => {
  const totalThirds = Math.round(stops * 3);

  if (totalThirds === 0) {
    return '0';
  }
  const sign = totalThirds > 0 ? '+' : '−';
  const absoluteThirds = Math.abs(totalThirds);
  return `${sign}${formatWholeAndThirds(Math.floor(absoluteThirds / 3), absoluteThirds % 3)}`;
};
