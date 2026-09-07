const PHONE_UA = /iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i;

export function isPhoneUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || /iPad/i.test(userAgent)) {
    return false;
  }
  return PHONE_UA.test(userAgent);
}
