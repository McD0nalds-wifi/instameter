type Rational = readonly [numerator: number, denominator: number];

export type ExifFixture = {
  exposureTime?: Rational;
  fNumber?: Rational;
  iso?: number;
  exposureBias?: Rational;
};

type Entry = {
  tag: number;
  type: number;
  dataSize: number;
  write: (view: DataView, entryOffset: number, dataOffset: number) => void;
};

const TYPE_SHORT = 3;
const TYPE_LONG = 4;
const TYPE_RATIONAL = 5;
const TYPE_SRATIONAL = 10;
const ENTRY_SIZE = 12;
const TIFF_HEADER_SIZE = 8;

const rationalEntry = (tag: number, type: number, [numerator, denominator]: Rational): Entry => ({
  tag,
  type,
  dataSize: 8,
  write: (view, entryOffset, dataOffset) => {
    view.setUint32(entryOffset + 8, dataOffset, true);
    view.setInt32(dataOffset, numerator, true);
    view.setInt32(dataOffset + 4, denominator, true);
  },
});

const shortEntry = (tag: number, value: number): Entry => ({
  tag,
  type: TYPE_SHORT,
  dataSize: 0,
  write: (view, entryOffset) => {
    view.setUint16(entryOffset + 8, value, true);
  },
});

const buildEntries = ({ exposureTime, fNumber, iso, exposureBias }: ExifFixture): Entry[] =>
  [
    exposureTime && rationalEntry(0x82_9a, TYPE_RATIONAL, exposureTime),
    fNumber && rationalEntry(0x82_9d, TYPE_RATIONAL, fNumber),
    iso === undefined ? undefined : shortEntry(0x88_27, iso),
    exposureBias && rationalEntry(0x92_04, TYPE_SRATIONAL, exposureBias),
  ].filter((entry): entry is Entry => entry !== undefined);

const buildTiff = (fixture: ExifFixture): Uint8Array<ArrayBuffer> => {
  const entries = buildEntries(fixture);
  const ifd0Offset = TIFF_HEADER_SIZE;
  const exifIfdOffset = ifd0Offset + 2 + ENTRY_SIZE + 4;
  const dataStart = exifIfdOffset + 2 + entries.length * ENTRY_SIZE + 4;
  const view = new DataView(new ArrayBuffer(dataStart + entries.length * 8));

  view.setUint16(0, 0x49_49, false);
  view.setUint16(2, 42, true);
  view.setUint32(4, ifd0Offset, true);

  view.setUint16(ifd0Offset, 1, true);
  view.setUint16(ifd0Offset + 2, 0x87_69, true);
  view.setUint16(ifd0Offset + 4, TYPE_LONG, true);
  view.setUint32(ifd0Offset + 6, 1, true);
  view.setUint32(ifd0Offset + 10, exifIfdOffset, true);

  view.setUint16(exifIfdOffset, entries.length, true);
  entries.forEach(({ tag, type, write }, index) => {
    const entryOffset = exifIfdOffset + 2 + index * ENTRY_SIZE;
    const dataOffset =
      dataStart + entries.slice(0, index).reduce((sum, { dataSize }) => sum + dataSize, 0);

    view.setUint16(entryOffset, tag, true);
    view.setUint16(entryOffset + 2, type, true);
    view.setUint32(entryOffset + 4, 1, true);
    write(view, entryOffset, dataOffset);
  });

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
