import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn utility', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('bg-red-500', 'p-4')).toBe('bg-red-500 p-4');
  });

  it('handles conditional classes', () => {
    expect(cn('bg-red-500', false && 'p-4')).toBe('bg-red-500');
    expect(cn('bg-red-500', true && 'p-4')).toBe('bg-red-500 p-4');
  });
});
