import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';

import { MeasureScene } from '../ui/MeasureScene';

import { currentMeasurementAtom } from '@/entities/measurement';
import { deviceCorrectionAtom } from '@/entities/preference';
import { jpegWithExif, jpegWithoutExif, setupUser } from '@/shared/lib/testing';

const asFile = (blob: Blob, name: string) => new File([blob], name, { type: 'image/jpeg' });

const renderWithStore = () => {
  const store = createStore();
  store.set(deviceCorrectionAtom, -0.5);
  const view = render(
    <Provider store={store}>
      <MeasureScene />
    </Provider>,
  );
  const [cameraInput, galleryInput] = view.container.querySelectorAll('input[type="file"]');
  return {
    store,
    cameraInput: cameraInput as HTMLInputElement,
    galleryInput: galleryInput as HTMLInputElement,
  };
};

describe('MeasureScene', () => {
  it('считает замер по снимку с учётом поправки устройства', async () => {
    const user = setupUser();
    const { store, cameraInput } = renderWithStore();
    const photo = asFile(
      jpegWithExif({ exposureTime: [1, 125], fNumber: [16, 1], iso: 100 }),
      'scene.jpg',
    );

    expect(cameraInput.getAttribute('capture')).toBe('environment');

    await user.upload(cameraInput, photo);

    await vi.waitFor(() => expect(store.get(currentMeasurementAtom)?.ev100).toBeCloseTo(14.47, 2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('объясняет, почему замер не получился, и не трогает прошлый замер', async () => {
    const user = setupUser({ applyAccept: false });
    const { store, galleryInput } = renderWithStore();

    await user.upload(galleryInput, asFile(jpegWithoutExif(), 'screenshot.jpg'));

    expect(await screen.findByText('В снимке нет данных об экспозиции')).toBeInTheDocument();
    expect(store.get(currentMeasurementAtom)).toBeNull();
  });

  describe('на iPhone', () => {
    const iphoneUserAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1';

    beforeEach(() => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(iphoneUserAgent);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('предлагает только выбор готового снимка и не открывает камеру из браузера', async () => {
      const user = setupUser();
      const { store, cameraInput: pickerInput } = renderWithStore();

      expect(screen.getByRole('button', { name: 'Выбрать снимок' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Снять' })).not.toBeInTheDocument();
      expect(screen.getByText(/в приложении «Камера»/)).toBeInTheDocument();
      expect(pickerInput.hasAttribute('capture')).toBe(false);

      await user.upload(
        pickerInput,
        asFile(
          jpegWithExif({ exposureTime: [1, 125], fNumber: [16, 1], iso: 100 }),
          'IMG_0001.jpg',
        ),
      );

      await vi.waitFor(() => expect(store.get(currentMeasurementAtom)).not.toBeNull());
    });

    it('объясняет, что iOS удаляет EXIF у снимков из браузера', async () => {
      const user = setupUser({ applyAccept: false });
      const { cameraInput: pickerInput } = renderWithStore();

      await user.upload(pickerInput, asFile(jpegWithoutExif(), 'image.jpg'));

      expect(await screen.findByText('iPhone не передал данные экспозиции')).toBeInTheDocument();
      expect(screen.getByText(/не нажимайте «Снять фото»/)).toBeInTheDocument();
    });
  });
});
