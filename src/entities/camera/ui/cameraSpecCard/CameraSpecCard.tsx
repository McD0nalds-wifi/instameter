import type { CameraSpec } from '../../model/cameraSpec';
import type { FC, ReactNode } from 'react';

import { Card, Paragraph } from '@heroui/react';

import { describeApertures, describeShutter } from '../../lib/describeSpec';

import { filmCatalog } from '@/entities/film/@x/camera';
import { strings } from '@/shared/config';

type CameraSpecCardProps = {
  spec: CameraSpec;
  action?: ReactNode;
};

const filmNames = (filmIds: readonly string[]) =>
  filmIds
    .map((filmId) => filmCatalog.films.find(({ id }) => id === filmId)?.name ?? filmId)
    .join(', ');

export const CameraSpecCard: FC<CameraSpecCardProps> = ({ spec, action }) => (
  <Card>
    <Card.Header>
      <Card.Title>{spec.model}</Card.Title>
      <Card.Description>{spec.brand}</Card.Description>
    </Card.Header>
    <Card.Content className="flex flex-col gap-1">
      <Paragraph size="sm">
        {strings.cameraSpec.film}: {filmNames(spec.filmIds)}
      </Paragraph>
      <Paragraph size="sm">
        {strings.cameraSpec.aperture}: {describeApertures(spec)}
      </Paragraph>
      <Paragraph size="sm">
        {strings.cameraSpec.shutter}: {describeShutter(spec)}
      </Paragraph>
    </Card.Content>
    {action && <Card.Footer>{action}</Card.Footer>}
  </Card>
);
