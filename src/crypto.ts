import type { JwsHeaderParams} from '@web5/crypto';

import { BearerDid } from '@web5/dids';
import { isDidVerificationMethod } from '@web5/dids/utils';
import { Convert } from '@web5/common';
import { canonicalize, isPublicJwk, LocalKeyManager, Sha256 } from '@web5/crypto';

import { DidResolver } from './did-resolver';

// Instantiate a LocalKeyManager to use for verifying signatures.
const keyManager = new LocalKeyManager()

/**
 * Options passed to {@link Crypto.sign}
 */
export type SignOptions = {
  /** Indicates whether the payload is detached from the JWS. If `true`, the payload is not included in the resulting JWS. */
  detached: boolean
  /** The DID to sign with. */
  did: BearerDid
  /** The payload to be signed. */
  payload: Uint8Array
}

/**
 * Options passed to {@link Crypto.verify}
 */
export type VerifyOptions = {
  /** The payload that was signed. required only if the signature is a detached JWS */
  detachedPayload?: Uint8Array
  /** The Compact JWS to verify. */
  jws: string
}

/**
 * Cryptographic utility functions, such as hashing, signing, and verifying
 */
export class Crypto {
  /**
   * Computes a digest of the payload by:
   *
   * 1. JSON Serializing the payload as per [RFC 8785: JSON Canonicalization Scheme](https://datatracker.ietf.org/doc/html/rfc8785).
   * 2. Computing the SHA-256 hash of the canonicalized payload.
   * 3. Base64URL encoding the hash without padding as per [RFC 7515: JSON Web Signature (JWS)](https://datatracker.ietf.org/doc/html/rfc7515#appendix-C).
   *
   * @returns The SHA-256 hash of the canonicalized payload, represented as a Base64URL encoded string.
   */
  static async digest(payload: { [key: string]: any }): Promise<Uint8Array> {
    const canonicalized = canonicalize(payload);
    const canonicalizedBytes = Convert.string(canonicalized).toUint8Array()

    const digest = await Sha256.digest({ data: canonicalizedBytes });

    return digest;
  }

  /**
   * Signs the provided payload and produces a Compact JSON Web Signature (JWS).
   *
   * @param params - The parameters required for signing.
   * @returns A promise that resolves to the generated compact JWS.
   * @throws Will throw an error if the specified algorithm is not supported.
   */
  static async sign({ did, payload, detached }: SignOptions) {
    const signer = await did.getSigner();

    const jwsHeader: JwsHeaderParams = { alg: signer.algorithm, kid: signer.keyId };
    const jwsHeaderBase64Url = Convert.object(jwsHeader).toBase64Url();
    const payloadBase64Url = Convert.uint8Array(payload).toBase64Url();

    const toSign = jwsHeaderBase64Url + '.' + payloadBase64Url;
    const toSignBytes = Convert.string(toSign).toUint8Array();

    const signatureBytes = await signer.sign({ data: toSignBytes });
    const signatureBase64Url = Convert.uint8Array(signatureBytes).toBase64Url();

    if (detached) {
      // Compact JWS format without the payload: https://datatracker.ietf.org/doc/html/rfc7515#appendix-F
      return jwsHeaderBase64Url + '..' + signatureBase64Url;
    } else {
      return jwsHeaderBase64Url + '.' + payloadBase64Url + '.' + signatureBase64Url;
    }
  }

  /**
   * Verifies the integrity of a message or resource's signature.
   *
   * @param params - The parameters required for verification.
   * @returns A Promise that resolves to the DID of the signer if verification is successful.
   * @throws Various errors related to invalid input or failed verification.
   */
  static async verify({ jws, detachedPayload }: VerifyOptions) {
    if (typeof jws !== 'string') {
      throw new InvalidJws('Signature verification failed: Expected Compact JWS in string format');
    }

    let { 0: jwsHeaderBase64Url, 1: payloadBase64Url, 2: signatureBase64Url, length } = jws.split('.');

    if (length !== 3) {
      throw new InvalidJws('Signature verification failed: Expected Compact JWS with 3 parts');
    }

    if (detachedPayload) {
      if (payloadBase64Url.length !== 0) { // Ensure that if a detached payload is provided, the JWS payload is empty.
        throw new InvalidJws('Signature verification failed: Expected detached JWS with empty payload');
      }
      payloadBase64Url = Convert.uint8Array(detachedPayload).toBase64Url();
    }

    let jwsHeader: JwsHeaderParams;
    try { // Ensure that the JWS Header can be parsed to a JSON object.
      jwsHeader = Convert.base64Url(jwsHeaderBase64Url).toObject() as JwsHeaderParams;
    } catch {
      throw new InvalidJws('Signature verification failed: Invalid JWS header');
    }

    if (!jwsHeader.alg || typeof jwsHeader.alg !== 'string') {
      throw new InvalidJws('Signature verification failed: Missing or invalid algorithm ("alg") in JWS header');
    }
    if (!jwsHeader.kid || typeof jwsHeader.kid !== 'string') {
      throw new InvalidJws('Signature verification failed: Missing or invalid key ID ("kid") in JWS header');
    }

    const dereferencingResult = await DidResolver.dereference(jwsHeader.kid);

    if (!isDidVerificationMethod(dereferencingResult.contentStream)) {
      throw new InvalidJws('Signature verification failed: Expected key id ("kid") in JWS header to dereference to a DID Document Verification Method');
    }

    const publicKeyJwk = dereferencingResult.contentStream.publicKeyJwk;
    if (!isPublicJwk(publicKeyJwk)) { // Ensure that Verification Method includes public key as a JWK.
      throw new Error('Signature verification failed: Expected kid in JWS header to dereference to a DID Document Verification Method with publicKeyJwk')
    }

    const signedData = jwsHeaderBase64Url + '.' + payloadBase64Url;
    const signedDataBytes = Convert.string(signedData).toUint8Array();

    const signatureBytes = Convert.base64Url(signatureBase64Url).toUint8Array();

    const isValidSignature = await keyManager.verify({ key: publicKeyJwk, data: signedDataBytes, signature: signatureBytes });

    if (!isValidSignature) {
      throw new InvalidJws('Signature verification failed: Integrity mismatch');
    }

    const [ did ] = jwsHeader.kid.split('#');

    return did;
  }
}

export class InvalidJws extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid JWS');
    this.name = 'InvalidJws';
  }
}