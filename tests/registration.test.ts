import { DidJwk } from '@web5/dids';
import { beforeEach, describe, expect, test } from 'bun:test';

import { DapRegistration } from '../src/registration'

describe('DapRegistration', () => {
  let registration: DapRegistration;

  beforeEach(() => {
    registration = DapRegistration.create({ handle: 'handle', did: 'did', domain: 'domain' });
  });

  describe('computeDigest', () => {
    test('computes a digest of the payload', async () => {
      const digest = await registration.computeDigest();
      expect(digest).toBeInstanceOf(Uint8Array);
    });
  });

  describe('create', () => {
    test('generates a unique ID each time', () => {
      const another = DapRegistration.create({ handle: 'handle', did: 'did', domain: 'domain' });
      expect(registration.id.toString()).not.toEqual(another.id.toString());
    });
  });

  describe('parse', () => {
    test('throws InvalidRegistrationId for invalid Registration IDs', () => {
    });

    test('returns an instance of DapRegistration if parsing is successful', async () => {
      const alice = await DidJwk.create();
      const registration = DapRegistration.create({
        handle: 'alice',
        did: alice.uri,
        domain: 'domain.com',
      });

      await registration.sign(alice);

      const jsonRegistration = JSON.stringify(registration);
      const parsedRegistration = await DapRegistration.parse(jsonRegistration);

      expect(jsonRegistration).toEqual(JSON.stringify(parsedRegistration));
    });
  });
});