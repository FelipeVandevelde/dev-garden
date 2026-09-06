import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeStorage } from '../src/utils/safeStorage';

describe('safeStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      __fallbackStorage: {}
    });
  });

  it('should get item from localStorage if available', () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('test-value');
    const result = safeStorage.getItem('test-key');
    expect(result).toBe('test-value');
    expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should fallback to __fallbackStorage if localStorage throws', () => {
    vi.mocked(window.localStorage.getItem).mockImplementation(() => {
      throw new Error('Access denied');
    });
    (window as any).__fallbackStorage['test-key'] = 'fallback-value';
    
    const result = safeStorage.getItem('test-key');
    expect(result).toBe('fallback-value');
  });

  it('should set item in localStorage if available', () => {
    safeStorage.setItem('test-key', 'test-value');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
  });

  it('should fallback to __fallbackStorage if localStorage.setItem throws', () => {
    vi.mocked(window.localStorage.setItem).mockImplementation(() => {
      throw new Error('Access denied');
    });
    
    safeStorage.setItem('test-key', 'fallback-value');
    expect((window as any).__fallbackStorage['test-key']).toBe('fallback-value');
  });
});
