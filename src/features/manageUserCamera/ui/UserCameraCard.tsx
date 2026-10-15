import type { UserCamera } from '@/entities/userCamera';
import type { FC } from 'react';

import { Button, Card, Chip } from '@heroui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Trash2 } from 'lucide-react';

import { FilmSelector } from './filmSelector/FilmSelector';

import { findFilm } from '@/entities/film';
import {
  activeCameraAtom,
  removeUserCameraAtom,
  resolveCameraSpec,
  setActiveCameraAtom,
  updateUserCameraAtom,
} from '@/entities/userCamera';
import { strings } from '@/shared/config';

type UserCameraCardProps = {
  camera: UserCamera;
};

export const UserCameraCard: FC<UserCameraCardProps> = ({ camera }) => {
  const activeCamera = useAtomValue(activeCameraAtom);
  const setActiveCamera = useSetAtom(setActiveCameraAtom);
  const updateCamera = useSetAtom(updateUserCameraAtom);
  const removeCamera = useSetAtom(removeUserCameraAtom);
  const spec = resolveCameraSpec(camera);
  const isActive = activeCamera?.id === camera.id;
  const filmIds = spec?.filmIds ?? [camera.loadedFilmId];

  const makeActive = () => void setActiveCamera(camera.id);
  const remove = () => void removeCamera(camera.id);
  const changeFilm = (loadedFilmId: string) => void updateCamera({ ...camera, loadedFilmId });

  return (
    <Card>
      <Card.Header className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Card.Title>{camera.nickname}</Card.Title>
          {spec && <Card.Description>{spec.brand}</Card.Description>}
        </div>
        <Button
          variant="ghost"
          isIconOnly
          className="min-h-11 min-w-11"
          aria-label={`${strings.userCamera.remove} ${camera.nickname}`}
          onPress={remove}
        >
          <Trash2 aria-hidden size={18} />
        </Button>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {filmIds.length > 1 ? (
          <FilmSelector
            filmIds={filmIds}
            selectedFilmId={camera.loadedFilmId}
            onChange={changeFilm}
          />
        ) : (
          <Chip variant="soft">
            {strings.userCamera.loadedFilm}:{' '}
            {findFilm(camera.loadedFilmId)?.name ?? camera.loadedFilmId}
          </Chip>
        )}
      </Card.Content>
      <Card.Footer>
        {isActive ? (
          <Chip color="accent" variant="primary">
            {strings.userCamera.active}
          </Chip>
        ) : (
          <Button variant="secondary" className="min-h-11" onPress={makeActive}>
            {strings.userCamera.makeActive}
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};
