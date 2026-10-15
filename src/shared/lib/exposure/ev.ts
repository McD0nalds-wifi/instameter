export type ExposureSettings = {
  exposureTime: number;
  fNumber: number;
  iso: number;
  exposureBias?: number;
};

export const sceneEv100 = (
  { exposureTime, fNumber, iso, exposureBias = 0 }: ExposureSettings,
  deviceCorrection = 0,
): number =>
  Math.log2((fNumber * fNumber) / exposureTime) -
  Math.log2(iso / 100) +
  exposureBias +
  deviceCorrection;

export const lvToEv100 = (lv: number, iso: number): number => lv - Math.log2(iso / 100);
