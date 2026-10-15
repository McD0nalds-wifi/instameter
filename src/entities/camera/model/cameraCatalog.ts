import type { CameraCatalog, CameraSpec } from './cameraSpec';

import cameras from '../config/cameras.json';

export const cameraCatalog = cameras as CameraCatalog;

export const findCameraSpec = (id: string): CameraSpec | undefined =>
  cameraCatalog.cameras.find((camera) => camera.id === id);
