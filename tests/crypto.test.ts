import { Convert } from '@web5/common';
import { BearerDid, DidJwk } from '@web5/dids';
import { beforeAll, describe, expect, test,  } from 'bun:test';

import { Crypto } from '../src/crypto';

describe('Crypto', () => {
  describe('digest', () => {
    test('returns a string', async () => {
      const result = await Crypto.digest({ test: 'value' });
      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('returns a non-empty array', async () => {
      const result = await Crypto.digest({ test: 'value' });
      expect(result.length).toBeGreaterThan(0);
    });

    test('should return the same digest for identical payloads', async () => {
      const payload = { a: 1, b: 'test' };
      const result1 = await Crypto.digest(payload);
      const result2 = await Crypto.digest(payload);
      expect(result1).toStrictEqual(result2);
    });

    test('should return different digests for different payloads', async () => {
      const result1 = await Crypto.digest({ a: 1 });
      const result2 = await Crypto.digest({ a: 2 });
      expect(result1).not.toStrictEqual(result2);
    });

    test('should handle nested objects', async () => {
      const payload = { a: 1, b: { c: 2, d: { e: 3 } } };
      const result = await Crypto.digest(payload);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle arrays', async () => {
      const payload = { a: [1, 2, 3], b: ['a', 'b', 'c'] };
      const result = await Crypto.digest(payload);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should be order-independent for object properties', async () => {
      const result1 = await Crypto.digest({ a: 1, b: 2 });
      const result2 = await Crypto.digest({ b: 2, a: 1 });
      expect(result1).toStrictEqual(result2);
    });

    test('should match a known good digest', async () => {
      const payload = { hello: 'world' };
      const expectedDigest = new Uint8Array([
        147, 162,  57, 113, 169,  20, 229, 234,
        203, 240, 168, 210,  81,  84, 205, 163,
          9, 195, 193, 199,  47, 187, 153,  20,
        212, 124,  96, 243, 203, 104,  21, 136,
      ])
      const result = await Crypto.digest(payload);
      expect(result).toStrictEqual(expectedDigest);
    });

    test('should correctly handle Unicode characters', async () => {
      const payload = { hello: '世界' };
      const result = await Crypto.digest(payload);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('sign', () => {
    let alice: BearerDid;

    beforeAll(async () => {
      alice = await DidJwk.create();
    });

    test('returns a Compact JWS string', async () => {
      const payload = { timestamp: new Date().toISOString() };
      const payloadBytes = Convert.object(payload).toUint8Array();

      const jws = await Crypto.sign({ did: alice, payload: payloadBytes, detached: false });

      expect(typeof jws).toBe('string');
      const { length } = jws.split('.');
      expect(length).toBe(3);
    });

    test('returns a Compact JWS string with detached payload', async () => {
      const payload = { timestamp: new Date().toISOString() };
      const payloadBytes = Convert.object(payload).toUint8Array();

      const jws = await Crypto.sign({ did: alice, payload: payloadBytes, detached: true });

      expect(typeof jws).toBe('string');
      const { length } = jws.split('.');
      expect(length).toBe(3);
    });
  });

  describe('verify', () => {
    let alice: BearerDid;

    beforeAll(async () => {
      alice = await DidJwk.create();
    });

    test('verifies Compact JWS', async () => {
      const payload = { timestamp: new Date().toISOString() };
      const payloadBytes = Convert.object(payload).toUint8Array();

      const jws = await Crypto.sign({ did: alice, payload: payloadBytes, detached: false });
      const signerDid = await Crypto.verify({ jws });

      expect(alice.uri).toEqual(signerDid);
    });

    test('verifies Compact JWS with detached payload', async () => {
      const payload = { timestamp: new Date().toISOString() };
      const payloadBytes = Convert.object(payload).toUint8Array();

      const jws = await Crypto.sign({ did: alice, payload: payloadBytes, detached: true });
      const signerDid = await Crypto.verify({ jws, detachedPayload: payloadBytes });

      expect(alice.uri).toEqual(signerDid);
    });

    test('throws InvalidJws for invalid JWS', async () => {
      // @ts-expect-error Testing invalid input
      expect(Crypto.verify({ jws: 2 })).rejects.toThrow('Expected Compact JWS in string format');
      expect(Crypto.verify({ jws: 'one.' })).rejects.toThrow('Expected Compact JWS with 3 parts');
      expect(Crypto.verify({ jws: '.one' })).rejects.toThrow('Expected Compact JWS with 3 parts');
      expect(Crypto.verify({ jws: 'one.two' })).rejects.toThrow('Expected Compact JWS with 3 parts');
      expect(Crypto.verify({ jws: 'one.two.three.four' })).rejects.toThrow('Expected Compact JWS with 3 parts');
      expect(Crypto.verify({ jws: 'one.two.three' })).rejects.toThrow('Invalid JWS header');
      console.log(Convert.uint8Array(new Uint8Array([1, 2, 3])).toBase64Url())


      // JWS detached payload input: new Uint8Array([1, 2, 3])
      expect(Crypto.verify({ jws: 'eyJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6ZXhhbXBsZToxMjMjMCJ9.AQID.', detachedPayload: new Uint8Array([1, 2, 3]) })).rejects.toThrow('Expected detached JWS with empty payload');

      // JWS Header input { kid: 'did:example:123#0' }
      expect(Crypto.verify({ jws: 'eyJraWQiOiJkaWQ6ZXhhbXBsZToxMjMjMCJ9..' })).rejects.toThrow('Missing or invalid algorithm ("alg") in JWS header');

      // JWS Header input { alg: 'ES256K' }
      expect(Crypto.verify({ jws: 'eyJhbGciOiJFUzI1NksifQ..' })).rejects.toThrow('Missing or invalid key ID ("kid") in JWS header');
      
      // JWS Header input { alg: 'ES256K', kid: 'did:example:123#0' }
      expect(Crypto.verify({ jws: 'eyJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6ZXhhbXBsZToxMjMjMCJ9..' })).rejects.toThrow('Expected key id ("kid") in JWS header to dereference to a DID Document Verification Method');
    })
  });
});