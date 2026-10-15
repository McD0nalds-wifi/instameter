import type { FC } from 'react';

import { Heading, Paragraph } from '@heroui/react';

import { strings } from '@/shared/config';

export const MyCamerasPage: FC = () => (
  <section className="flex flex-col gap-3">
    <Heading level={1}>{strings.myCamerasPage.title}</Heading>
    <Paragraph className="text-muted">{strings.myCamerasPage.placeholder}</Paragraph>
  </section>
);
