import { BearerDid } from '@web5/dids';

import { Crypto } from './crypto';
import { RegistrationId } from './registration-id';

/**
 * Information about the DAP Registry
 */
export interface RegistrationMetadata {
  /** Indicates whether registration is enabled. */
  enabled: boolean;
  
  /** Supported DID methods. */
  supportedDidMethods?: string[];
}

/**
 * Represents the full DAP registration: metadata and signature.
 */
export interface RegistrationModel {
  id: string;
  handle: string;
  did: string;
  domain: string;
  signature: string;
}

export interface RegistrationRequest extends RegistrationModel {}

export interface RegistrationResponse {
  proof: RegistrationModel;
}

export interface ErrorResponse {
  error: {
    message: string;
  };
}

export class DapRegistration {
  id: RegistrationId;
  handle: string;
  did: string;
  domain: string;
  signature?: string;

  /**
   * Constructor is primarily for intended for internal use. For a better developer experience,
   * consumers should use {@link DapRegistration.create} and {@link DapRegistration.parse} to
   * programmatically create and parse messages.
   */
  constructor(id: RegistrationId, handle: string, did: string, domain: string, signature?: string) {
    this.did = did;
    this.domain = domain;
    this.handle = handle;
    this.id = id;
    this.signature = signature;
  }

  /**
   * Computes a digest of the payload by:
   * 1. Initializing `payload` to a JSON object containing the registration ID, handle, DID, and domain.
   * 2. JSON Serializing the payload as per [RFC 8785: JSON Canonicalization Scheme](https://datatracker.ietf.org/doc/html/rfc8785).
   * 3. Computing the SHA-256 hash of the canonicalized payload.
   *
   * @returns The SHA-256 hash of the canonicalized payload, represented as a byte array.
   */
  async computeDigest(): Promise<Uint8Array> {
    const payload = {
      id: this.id.toString(),
      handle: this.handle,
      did: this.did,
      domain: this.domain
    };

    const digest = await Crypto.digest(payload);

    return digest;
  }

  /**
   * Creates a new DAP registration with the specified parameters.
   * @param params - The parameters required for creating a DAP registration. 
   * @returns {@link DapRegistration}
   */
  static create({ handle, did, domain }: { handle: string, did: string, domain: string }): DapRegistration {
    const id = RegistrationId.create();
    const registration = new DapRegistration(id, handle, did, domain);
    registration.validate();

    return registration;
  }

  /**
   * Parses a JSON message into a DAP registration.
   * @returns A promise that resolves to a {@link DapRegistration} instance.
   */
  static async parse(rawRequest: RegistrationRequest | string): Promise<DapRegistration> {
    const jsonRegistration = DapRegistration.#rawToRegistrationRequest(rawRequest);

    const registration = new DapRegistration(
      RegistrationId.parse(jsonRegistration.id),
      jsonRegistration.handle,
      jsonRegistration.did,
      jsonRegistration.domain,
      jsonRegistration.signature
    );

    await registration.verify();

    return registration;
  }

  /**
   * Signs the provided payload and produces a Compact JSON Web Signature (JWS).
   *
   * @param opts - The options required for signing.
   * @returns A promise that resolves to the generated compact JWS.
   * @throws Will throw an error if the specified algorithm is not supported.
   */
  async sign(did: BearerDid): Promise<void> {
    const payload = await this.computeDigest();
    this.signature = await Crypto.sign({ did, payload, detached: true });
  }

  /**
   * Validates the data in the DAP Registration.
   * @throws if the registration is invalid
   */
  validate(): void {
    // To be implemented...
  }

  /**
   * Verifies the integrity of the cryptographic signature
   * @throws if the signature is invalid
   * @throws if the signer's DID does not match the specified did.
   * @returns Signer's DID
   */
  async verify(): Promise<string> {
    if (this.signature === undefined) {
      throw new InvalidDapRegistration('Invalid DAP Registration: Signature is missing')
    }

    const payload = await this.computeDigest();
    const signerDid = await Crypto.verify({ jws: this.signature, detachedPayload: payload });

    if (this.did !== signerDid) { // Ensure that the DID that signed the payload matches the DID in the registration.
      throw new InvalidDapRegistration('Invalid DAP Registration: Expected registration to be signed by the specified DID');
    }
    
    return signerDid;
  }

  toJSON(): object {
    return {
      id: this.id.toString(),
      handle: this.handle,
      did: this.did,
      domain: this.domain,
      signature: this.signature,
    };
  }

  static #rawToRegistrationRequest(rawRequest: RegistrationRequest | string): RegistrationRequest {
    try {
      return typeof rawRequest === 'string' ? JSON.parse(rawRequest) : rawRequest;
    } catch (error: any) {
      const errorMessage = error?.message ?? 'Unknown error';
      throw new InvalidDapRegistration(`Failed to parse DAP registration: ${errorMessage}`);
    }
  }
}

export class InvalidDapRegistration extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid DAP Registration');
    this.name = 'InvalidDapRegistration';
  }
}