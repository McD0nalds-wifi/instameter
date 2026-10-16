import type { CameraSpec } from '@/entities/camera';
import type { FC } from 'react';

import { Button } from '@heroui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Plus } from 'lucide-react';
import { useLocation } from 'wouter';

import { currentMeasurementAtom } from '@/entities/measurement';
import {
  addUserCameraAtom,
  createUserCameraFromSpec,
  userCamerasAtom,
} from '@/entities/userCamera';
import { paths, strings } from '@/shared/config';

type AddCameraButtonProps = {
  spec: CameraSpec;
};

export const AddCameraButton: FC<AddCameraButtonProps> = ({ spec }) => {
  const cameras = useAtomValue(userCamerasAtom);
  const addCamera = useSetAtom(addUserCameraAtom);
  const measurement = useAtomValue(currentMeasurementAtom);
  const [, navigate] = useLocation();
  const isAdded = cameras.some(({ specId }) => specId === spec.id);

  const addAndContinue = async () => {
    await addCamera(createUserCameraFromSpec(spec));
    navigate(measurement ? paths.measure : paths.myCameras);
  };

  const handlePress = () => void addAndContinue();

  return (
    <Button variant="secondary" className="min-h-11" isDisabled={isAdded} onPress={handlePress}>
      <Plus aria-hidden size={18} />
      {isAdded ? strings.addCamera.added : strings.addCamera.add}
    </Button>
  );
};
