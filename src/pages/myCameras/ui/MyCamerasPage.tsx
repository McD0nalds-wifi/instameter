import type { FC } from 'react';

import { Button, Heading, Paragraph } from '@heroui/react';
import { useAtomValue } from 'jotai';
import { Plus } from 'lucide-react';
import { useLocation } from 'wouter';

import { userCamerasAtom } from '@/entities/userCamera';
import { UserCameraCard } from '@/features/manageUserCamera';
import { paths, strings } from '@/shared/config';

export const MyCamerasPage: FC = () => {
  const cameras = useAtomValue(userCamerasAtom);
  const [, navigate] = useLocation();
  const openCatalog = () => navigate(paths.catalog);
  const hasCameras = cameras.length > 0;

  return (
    <section className="flex flex-col gap-4">
      <Heading level={1}>{strings.myCamerasPage.title}</Heading>
      {hasCameras ? (
        <ul className="flex flex-col gap-3">
          {cameras.map((camera) => (
            <li key={camera.id}>
              <UserCameraCard camera={camera} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-1">
          <Heading level={2}>{strings.myCamerasPage.emptyTitle}</Heading>
          <Paragraph className="text-muted">{strings.myCamerasPage.emptyDescription}</Paragraph>
        </div>
      )}
      <Button
        variant={hasCameras ? 'secondary' : 'primary'}
        className="min-h-11"
        onPress={openCatalog}
      >
        <Plus aria-hidden size={18} />
        {hasCameras ? strings.myCamerasPage.addMore : strings.myCamerasPage.addFromCatalog}
      </Button>
    </section>
  );
};
