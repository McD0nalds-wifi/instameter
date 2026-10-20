import { jpegWithExif, jpegWithoutExif } from '../../testing';
import { exposureFromTags, readExposure } from '../readExposure';

describe('readExposure', () => {
  it('читает экспопару и смещение из JPEG', async () => {
    const file = jpegWithExif({
      exposureTime: [1, 120],
      fNumber: [178, 100],
      iso: 32,
      exposureBias: [-7, 10],
    });

    const result = await readExposure(file);

    expect(result).toEqual({
      status: 'ok',
      exposure: { exposureTime: 1 / 120, fNumber: 1.78, iso: 32, exposureBias: -0.7 },
    });
  });

  it('считает смещение нулевым, если телефон его не записал', async () => {
    const result = await readExposure(
      jpegWithExif({ exposureTime: [1, 60], fNumber: [18, 10], iso: 100 }),
    );

    expect(result).toEqual({
      status: 'ok',
      exposure: { exposureTime: 1 / 60, fNumber: 1.8, iso: 100, exposureBias: 0 },
    });
  });

  it('сообщает, каких полей не хватает', async () => {
    const result = await readExposure(jpegWithExif({ exposureTime: [1, 60], iso: 100 }));

    expect(result).toEqual({ status: 'missing-fields', missing: ['fNumber'] });
  });

  it('отличает снимок без EXIF', async () => {
    await expect(readExposure(jpegWithoutExif())).resolves.toEqual({ status: 'no-exif' });
  });

  it('не падает на файле, который не картинка', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = await readExposure(new Blob(['не картинка'], { type: 'text/plain' }));

    expect(['unreadable', 'no-exif']).toContain(result.status);
    warn.mockRestore();
  });
});

describe('exposureFromTags', () => {
  it('берёт первое значение ISO, если телефон записал массив', () => {
    expect(exposureFromTags({ ExposureTime: 0.01, FNumber: 2, ISO: [50] })).toEqual({
      status: 'ok',
      exposure: { exposureTime: 0.01, fNumber: 2, iso: 50, exposureBias: 0 },
    });
  });

  it('считает отсутствующими нулевые и мусорные значения', () => {
    expect(exposureFromTags({ ExposureTime: 0, FNumber: 'f/2', ISO: 100 })).toEqual({
      status: 'missing-fields',
      missing: ['exposureTime', 'fNumber'],
    });
  });

  it('без тегов экспозиции сообщает, что EXIF нет', () => {
    expect(exposureFromTags(null)).toEqual({ status: 'no-exif' });
    expect(exposureFromTags({ Make: 'Apple' })).toEqual({ status: 'no-exif' });
  });

  it('возвращает область объекта, если телефон записал SubjectArea', async () => {
    const result = await readExposure(
      jpegWithExif({
        exposureTime: [1, 310],
        fNumber: [15, 10],
        iso: 50,
        orientation: 6,
        pixelWidth: 4032,
        pixelHeight: 3024,
        subjectArea: [2016, 1512, 403, 302],
      }),
    );

    expect(result.status === 'ok' && result.subjectRegion?.x).toBeCloseTo(0.45, 2);
  });
});
