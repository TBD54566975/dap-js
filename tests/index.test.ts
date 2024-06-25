import { expect, test } from 'bun:test';
import { add } from '../src/index.ts';

test('2 + 2', () => {
  expect(add(2, 2)).toBe(4);
});