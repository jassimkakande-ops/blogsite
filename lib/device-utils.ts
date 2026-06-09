export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

export const canStreamMKV = (): boolean => {
  if (isIOSDevice()) return false;
  return true;
};