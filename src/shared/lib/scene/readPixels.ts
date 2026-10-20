import type { PixelGrid } from './meteringBias';

const ANALYSIS_SIZE = 96;

export const readPixels = async (file: Blob): Promise<PixelGrid | undefined> => {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = ANALYSIS_SIZE / Math.max(bitmap.width, bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      bitmap.close();
      return undefined;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return { width, height, data: context.getImageData(0, 0, width, height).data };
  } catch (error) {
    console.warn('[scene] не удалось прочитать пиксели снимка', error);
    return undefined;
  }
};
