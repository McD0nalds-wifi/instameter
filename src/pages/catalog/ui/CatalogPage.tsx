import type { FC } from 'react';

import { Heading, Paragraph } from '@heroui/react';

import { cameraCatalog, CameraSpecCard } from '@/entities/camera';
import { AddCameraButton } from '@/features/addCamera';
import { strings } from '@/shared/config';

export const CatalogPage: FC = () => (
  <section className="flex flex-col gap-4">
    <Heading level={1}>{strings.catalogPage.title}</Heading>
    <Paragraph className="text-muted">{strings.catalogPage.description}</Paragraph>
    <ul className="flex flex-col gap-3">
      {cameraCatalog.cameras.map((spec) => (
        <li key={spec.id}>
          <CameraSpecCard spec={spec} action={<AddCameraButton spec={spec} />} />
        </li>
      ))}
    </ul>
  </section>
);
