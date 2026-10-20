type Rational = readonly [numerator: number, denominator: number];

export type ExifFixture = {
  exposureTime?: Rational;
  fNumber?: Rational;
  iso?: number;
  exposureBias?: Rational;
  orientation?: number;
  pixelWidth?: number;
  pixelHeight?: number;
  subjectArea?: readonly number[];
};

type Entry = {
  tag: number;
  type: number;
  count: number;
  dataSize: number;
  write: (view: DataView, valueOffset: number) => void;
};

const TYPE_SHORT = 3;
const TYPE_LONG = 4;
const TYPE_RATIONAL = 5;
const TYPE_SRATIONAL = 10;
const ENTRY_SIZE = 12;
const TIFF_HEADER_SIZE = 8;
const INLINE_LIMIT = 4;

const rationalEntry = (tag: number, type: number, [numerator, denominator]: Rational): Entry => ({
  tag,
  type,
  count: 1,
  dataSize: 8,
  write: (view, valueOffset) => {
    view.setInt32(valueOffset, numerator, true);
    view.setInt32(valueOffset + 4, denominator, true);
  },
});

const shortsEntry = (tag: number, values: readonly number[]): Entry => ({
  tag,
  type: TYPE_SHORT,
  count: values.length,
  dataSize: values.length * 2 > INLINE_LIMIT ? values.length * 2 : 0,
  write: (view, valueOffset) => {
    values.forEach((value, index) => view.setUint16(valueOffset + index * 2, value, true));
  },
});

const longEntry = (tag: number, value: number): Entry => ({
  tag,
  type: TYPE_LONG,
  count: 1,
  dataSize: 0,
  write: (view, valueOffset) => view.setUint32(valueOffset, value, true),
});

const isEntry = (entry: Entry | undefined): entry is Entry => entry !== undefined;

const buildExifEntries = (fixture: ExifFixture): Entry[] =>
  [
    fixture.exposureTime && rationalEntry(0x82_9a, TYPE_RATIONAL, fixture.exposureTime),
    fixture.fNumber && rationalEntry(0x82_9d, TYPE_RATIONAL, fixture.fNumber),
    fixture.iso === undefined ? undefined : shortsEntry(0x88_27, [fixture.iso]),
    fixture.exposureBias && rationalEntry(0x92_04, TYPE_SRATIONAL, fixture.exposureBias),
    fixture.subjectArea && shortsEntry(0x92_14, fixture.subjectArea),
    fixture.pixelWidth === undefined ? undefined : longEntry(0xa0_02, fixture.pixelWidth),
    fixture.pixelHeight === undefined ? undefined : longEntry(0xa0_03, fixture.pixelHeight),
  ].filter(isEntry);

const ifdSize = (entries: Entry[]) => 2 + entries.length * ENTRY_SIZE + 4;

const dataSize = (entries: Entry[]) => entries.reduce((sum, entry) => sum + entry.dataSize, 0);

const writeIfd = (view: DataView, ifdOffset: number, entries: Entry[], dataStart: number) => {
  view.setUint16(ifdOffset, entries.length, true);
  entries.forEach(({ tag, type, count, dataSize: size, write }, index) => {
    const entryOffset = ifdOffset + 2 + index * ENTRY_SIZE;
    const outOfLineOffset =
      dataStart + entries.slice(0, index).reduce((sum, entry) => sum + entry.dataSize, 0);

    view.setUint16(entryOffset, tag, true);
    view.setUint16(entryOffset + 2, type, true);
    view.setUint32(entryOffset + 4, count, true);

    if (size > 0) {
      view.setUint32(entryOffset + 8, outOfLineOffset, true);
      write(view, outOfLineOffset);
    } else {
      write(view, entryOffset + 8);
    }
  });
};

const buildTiff = (fixture: ExifFixture): Uint8Array<ArrayBuffer> => {
  const exifEntries = buildExifEntries(fixture);
  const ifd0Offset = TIFF_HEADER_SIZE;
  const ifd0WithoutPointer: Entry[] =
    fixture.orientation === undefined ? [] : [shortsEntry(0x01_12, [fixture.orientation])];
  const ifd0Length = ifdSize([...ifd0WithoutPointer, longEntry(0, 0)]);
  const exifIfdOffset = ifd0Offset + ifd0Length;
  const ifd0Entries = [...ifd0WithoutPointer, longEntry(0x87_69, exifIfdOffset)];
  const exifDataStart = exifIfdOffset + ifdSize(exifEntries);
  const view = new DataView(new ArrayBuffer(exifDataStart + dataSize(exifEntries)));

  view.setUint16(0, 0x49_49, false);
  view.setUint16(2, 42, true);
  view.setUint32(4, ifd0Offset, true);
  writeIfd(view, ifd0Offset, ifd0Entries, exifIfdOffset);
  writeIfd(view, exifIfdOffset, exifEntries, exifDataStart);

  return new Uint8Array(view.buffer);
};

export const jpegWithExif = (fixture: ExifFixture): Blob => {
  const tiff = buildTiff(fixture);
  const exifHeader = new TextEncoder().encode('Exif\0\0');
  const segmentLength = 2 + exifHeader.length + tiff.length;
  const app1Header = new Uint8Array([0xff, 0xe1, segmentLength >> 8, segmentLength & 0xff]);

  return new Blob(
    [new Uint8Array([0xff, 0xd8]), app1Header, exifHeader, tiff, new Uint8Array([0xff, 0xd9])],
    { type: 'image/jpeg' },
  );
};

export const jpegWithoutExif = (): Blob =>
  new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' });
