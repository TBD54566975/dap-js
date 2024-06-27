import { beforeEach, describe, expect, setSystemTime, test } from 'bun:test';

import { InvalidRegistrationId, RegistrationId } from '../src/registration-id'

describe('RegistrationId', () => {
  let registrationId: RegistrationId;

  beforeEach(async () => {
    registrationId = RegistrationId.create();
  });

  describe('constructor', () => {
    test('generates a unique ID each time', () => {
      const another = RegistrationId.create();
      expect(registrationId.toString()).not.toEqual(another.toString());
    });
  });

  describe('extractDate', () => {
    test('returns a Date object', () => {
      const date = registrationId.extractDate();
      expect(date).toBeInstanceOf(Date);
    });

    test('returns a date close to the current time', () => {
      const date = registrationId.extractDate();
      const now = new Date();
      const diffInMs = Math.abs(now.getTime() - date.getTime());
      expect(diffInMs).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('extractTimestamp', () => {
    test('returns a number', () => {
      const timestamp = registrationId.extractTimestamp();
      expect(typeof timestamp).toBe('number');
    });

    test('is consistent with extractDate', () => {
      const timestamp = registrationId.extractTimestamp();
      const date = registrationId.extractDate();
      expect(timestamp).toBe(date.getTime());
    });
  });

  describe('toString', () => {
    test('returns a string with the expected prefix', () => {
      expect(registrationId.toString()).toMatch(/^reg_/);
    });
  });

  describe('parse', () => {
    test('throws InvalidRegistrationId for invalid Registration IDs', () => {
      let registrationId = 'reg_1234567890abcdef';
      expect(() => RegistrationId.parse(registrationId)).toThrow(InvalidRegistrationId);
      expect(() => RegistrationId.parse(registrationId)).toThrowError('Invalid length');

      registrationId = '1234567890abcdef1234567890';
      expect(() => RegistrationId.parse(registrationId)).toThrowError('prefix must be "reg"');
    });
  });

  describe('timestamp precision', () => {
    test('has millisecond precision', () => {
      setSystemTime(new Date('2021-07-15T00:00:00.000Z'));
      const timestamp1 =  RegistrationId.create().extractTimestamp();

      setSystemTime(new Date('2021-07-15T00:00:00.001Z'));
      const timestamp2 =  RegistrationId.create().extractTimestamp();

      // Reset the 
      setSystemTime();

      // The difference should be exactly 1 millisecond.
      const diffInMs = Math.abs(timestamp2 - timestamp1);
      expect(diffInMs).toBe(1);
    });
  });

  describe('timestamp range', () => {
    test('handles dates far in the future', async () => {
      const futureDate = new Date('2100-01-01T00:00:00Z');

      // vi.useFakeTimers();
      setSystemTime(futureDate);
      const futureId = RegistrationId.create();
      setSystemTime();
      // vi.useRealTimers();

      expect(futureId.extractDate()).toEqual(futureDate);
    });
  });

  test('handles dates in the past', () => {
    const pastDate = new Date('1970-01-02T00:00:00Z');

    // vi.useFakeTimers()
    setSystemTime(pastDate);
    const pastId = RegistrationId.create();
    setSystemTime();
    // vi.useRealTimers()

    expect(pastId.extractDate()).toEqual(pastDate);
  });
});