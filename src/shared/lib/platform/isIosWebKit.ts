type NavigatorLike = Pick<Navigator, 'userAgent' | 'maxTouchPoints'>;

const IOS_DEVICE_PATTERN = /iPhone|iPad|iPod/;

const isIpadWithDesktopUserAgent = ({ userAgent, maxTouchPoints }: NavigatorLike) =>
  userAgent.includes('Macintosh') && maxTouchPoints > 1;

export const isIosWebKit = (target: NavigatorLike = navigator): boolean =>
  IOS_DEVICE_PATTERN.test(target.userAgent) || isIpadWithDesktopUserAgent(target);
