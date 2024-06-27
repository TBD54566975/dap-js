import { expect, test, describe } from "bun:test";
import { Dap, InvalidDap } from '../src/dap';

describe('Dap', () => {
  test('converts to string correctly', () => {
    const dap = new Dap('handle', 'domain.com');
    expect(dap.toString()).toBe('@handle/domain.com');
  });

  test('parses valid DAP string', () => {
    const dap = Dap.parse('@handle/domain.com');
    expect(dap.handle).toBe('handle');
    expect(dap.domain).toBe('domain.com');
  });

  test('throws InvalidDap for invalid DAPs', () => {
    const invalidDaps = [
      '',
      'a',
      '@handle',
      '@handle/',
      '@handle@/domain.com',
      '@@handle/domain.com',
      '@handle//domain.com',
      '@handle/@domain.com',
      '@handle/domain.com@',
      '@handle/domain.com/',
      'handle@domain.com',
    ];

    invalidDaps.forEach(dap => {
      expect(() => Dap.parse(dap)).toThrow(InvalidDap);
      expect(() => Dap.parse(dap)).toThrow('Invalid DAP');
    });
  });
});