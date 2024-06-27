import { describe, it, expect } from 'bun:test';
import { Urn, InvalidUrn } from '../src/urn';

describe('Urn', () => {
  it('parses a simple URN correctly', () => {
    const urn = Urn.parse('urn:nid:nss');
    expect(urn.toString()).toBe('urn:nid:nss');
    expect(urn.nid).toBe('nid');
    expect(urn.nss).toBe('nss');
  });

  it('parses a URN with multiple NSS parts', () => {
    const urn = Urn.parse('urn:nid:nss1:nss2:nss3');
    expect(urn.toString()).toBe('urn:nid:nss1:nss2:nss3');
    expect(urn.nid).toBe('nid');
    expect(urn.nss).toBe('nss1:nss2:nss3');
  });

  it('throws InvalidUrn for invalid URNs', () => {
    const invalidUrns = [
      '',
      'invalid:nid:nss',
      'invalid::nss',
      'invalid:nid:',
      'invalid:nid',
      'invalid:',
      'invalid::',
    ];

    invalidUrns.forEach(urn => {
      expect(() => Urn.parse(urn)).toThrow(InvalidUrn);
      expect(() => Urn.parse(urn)).toThrow('Invalid URN');
    });
  });
});