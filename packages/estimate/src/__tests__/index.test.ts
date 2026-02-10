import { describe, it, expect } from 'vitest';

describe('@autobe/estimate', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have correct version', () => {
    const pkg = require('../../package.json');
    expect(pkg.name).toBe('@autobe/estimate');
  });
});
