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
