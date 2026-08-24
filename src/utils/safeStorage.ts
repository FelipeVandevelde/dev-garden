export const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return (window as any).__fallbackStorage?.[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      if (!(window as any).__fallbackStorage) {
        (window as any).__fallbackStorage = {};
      }
      (window as any).__fallbackStorage[key] = value;
    }
  }
};
