import { typeid, TypeID } from 'typeid-js';

/**
 * Represents a unique identifier for a DAP registration.
 */
export class RegistrationId {
  /** The internal TypeID value with the 'reg' prefix. */
  private value: TypeID<'reg'>;

  /**
   * Creates a new RegistrationId instance.
   */
  constructor(id: TypeID<'reg'>) {
    this.value = id;
  }

  /**
   * Creates a new RegistrationId instance with a random UUID.
   */
  static create() {
    const id = typeid('reg');
    return new RegistrationId(id);
  }

  /**
   * Extracts the date from the registration ID.
   * 
   * @returns A Date object representing the timestamp encoded in the ID.
   */
  extractDate(): Date {
    const timestamp = this.extractTimestamp();

    return new Date(timestamp);
  }

  /**
   * Extracts the millisecond timestamp from the UUID.
   * 
   * @remarks
   * The first 6 bytes of the UUID are a timestamp in milliseconds since the Unix epoch.
   * 
   * @returns The timestamp in milliseconds.
   */
  extractTimestamp(): number {
    // Extract the first 12 alphanumeric characters from the UUID.
    const timestampHex = this.value.toUUID().slice(0, 13).replace('-', '');

    // Convert the hex string to a number.
    const timestampMilliseconds = parseInt(timestampHex, 16);

    return timestampMilliseconds;
  }
  
  /**
   * Converts the RegistrationId to its string representation.
   * 
   * @returns A string representation of the RegistrationId, including the 'reg' prefix.
   * 
   * @example
   * const regId = new RegistrationId();
   * console.log(regId.toString()); // Outputs: reg_1234567890abcdef...
   */
  toString(): string {
    return this.value.toString();
  }

  /**
   * Parses a string representation of a RegistrationId and returns a TypeID.
   * 
   * @param id - The string representation of a RegistrationId to parse.
   * @returns A TypeID representing the parsed RegistrationId.
   * @throws {InvalidRegistrationId} If the provided string is not a valid RegistrationId.
   * 
   * @example
   * const parsed = RegistrationId.parse('reg_1234567890abcdef...');
   */
    static parse(id: string): RegistrationId {
      try {
        const parsed = TypeID.fromString(id);
        if (parsed.getType() !== 'reg') {
          throw new InvalidRegistrationId('Registration ID prefix must be "reg"');
        }
        return new RegistrationId(parsed as TypeID<'reg'>);
      } catch (error: any) {
        throw new InvalidRegistrationId(error?.message);
      }
    }
}

export class InvalidRegistrationId extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid Registration ID');
    this.name = 'InvalidRegistrationId';
  }
}