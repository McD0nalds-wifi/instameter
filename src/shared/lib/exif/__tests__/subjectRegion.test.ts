import { subjectRegionFromTags } from '../subjectRegion';

const sensor = { ExifImageWidth: 4000, ExifImageHeight: 3000 };

describe('subjectRegionFromTags', () => {
  it('переводит прямоугольник SubjectArea в доли кадра', () => {
    const region = subjectRegionFromTags({ ...sensor, SubjectArea: [2000, 1500, 800, 600] });

    expect(region?.x).toBeCloseTo(0.4);
    expect(region?.y).toBeCloseTo(0.4);
    expect(region?.width).toBeCloseTo(0.2);
    expect(region?.height).toBeCloseTo(0.2);
  });

  it('поворачивает точку фокуса вместе с вертикальным снимком', () => {
    const region = subjectRegionFromTags({
      ...sensor,
      Orientation: 6,
      SubjectArea: new Uint16Array([1000, 750, 400, 300]),
    });

    expect(region!.x + region!.width / 2).toBeCloseTo(0.75);
    expect(region!.y + region!.height / 2).toBeCloseTo(0.25);
    expect(region?.width).toBeCloseTo(0.1);
    expect(region?.height).toBeCloseTo(0.1);
  });

  it('из точки делает небольшую область вокруг неё', () => {
    const region = subjectRegionFromTags({ ...sensor, SubjectArea: [2000, 1500] });

    expect(region?.width).toBeCloseTo(0.12);
    expect(region!.x + region!.width / 2).toBeCloseTo(0.5);
  });

  it('без размеров кадра или точки фокуса ничего не возвращает', () => {
    expect(subjectRegionFromTags({ SubjectArea: [10, 10, 5, 5] })).toBeUndefined();
    expect(subjectRegionFromTags(sensor)).toBeUndefined();
  });
});
