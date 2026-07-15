import { describe, it, expect } from 'vitest';
import { contrastyColor } from './utilities';

describe('contrastyColor', () => {
  it('returns white for dark background', () => {
    expect(contrastyColor('#000000')).toBe('#ffffff');
  });

  it('returns black for light background', () => {
    expect(contrastyColor('#ffffff')).toBe('#000000');
  });

  it('handles short hex', () => {
    expect(contrastyColor('#000')).toBe('#ffffff');
  });
});
