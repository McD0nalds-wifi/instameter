import { isIosWebKit } from '../isIosWebKit';

const iphoneSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1';
const iphoneChrome =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1';
const ipadDesktopMode =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Safari/605.1.15';
const androidChrome =
  'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

describe('isIosWebKit', () => {
  it('узнаёт iPhone в любом браузере: на iOS все они работают на WebKit', () => {
    expect(isIosWebKit({ userAgent: iphoneSafari, maxTouchPoints: 5 })).toBe(true);
    expect(isIosWebKit({ userAgent: iphoneChrome, maxTouchPoints: 5 })).toBe(true);
  });

  it('узнаёт iPad, который представляется настольным Mac', () => {
    expect(isIosWebKit({ userAgent: ipadDesktopMode, maxTouchPoints: 5 })).toBe(true);
  });

  it('не путает с настоящим Mac и с Android', () => {
    expect(isIosWebKit({ userAgent: ipadDesktopMode, maxTouchPoints: 0 })).toBe(false);
    expect(isIosWebKit({ userAgent: androidChrome, maxTouchPoints: 5 })).toBe(false);
  });
});
