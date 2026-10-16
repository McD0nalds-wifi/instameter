import { strings } from '@/shared/config';

type SceneKey = keyof typeof strings.scene;

const sceneThresholds: readonly (readonly [minEv100: number, scene: SceneKey])[] = [
  [15.5, 'snow'],
  [14.5, 'brightSun'],
  [13.5, 'hazySun'],
  [12.5, 'lightClouds'],
  [11, 'overcast'],
  [9, 'deepShade'],
  [7, 'twilight'],
  [5, 'eveningRoom'],
];

export const describeScene = (ev100: number): string => {
  const match = sceneThresholds.find(([minEv100]) => ev100 >= minEv100);
  return strings.scene[match ? match[1] : 'dark'];
};
