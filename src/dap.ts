/**
 * Represents a Decentralized Agnostic Paytag (DAP).
 * A DAP is a human-friendly identifier used for sending and receiving money across different platforms.
 */
export class Dap {
  /** The prefix character for a DAP. */
  static readonly PREFIX = '@';

  /** The separator character between the handle and domain in a DAP. */
  static readonly SEPARATOR = '/';

  /** Regular expression for validating and parsing DAP strings. */
  private static readonly DAP_REGEX = new RegExp(`^${Dap.PREFIX}([^${Dap.PREFIX}${Dap.SEPARATOR}]+)${Dap.SEPARATOR}([^${Dap.PREFIX}${Dap.SEPARATOR}]+)$`);

  /**
   * Creates a new DAP instance.
   * @param handle - The local handle part of the DAP.
   * @param domain - The domain part of the DAP.
   */
  constructor(
    public handle: string,
    public domain: string
  ) {}

  /**
   * Converts the DAP instance to its string representation.
   * @returns The string representation of the DAP.
   */
  toString(): string {
    return `${Dap.PREFIX}${this.handle}${Dap.SEPARATOR}${this.domain}`;
  }

  /**
   * Parses a DAP string and creates a new DAP instance.
   * @param dap - The DAP string to parse.
   * @returns A new DAP instance.
   * @throws {InvalidDap} If the provided string is not a valid DAP.
   */
  static parse(dap: string): Dap {
    const match = dap.match(Dap.DAP_REGEX);
    if (!match) {
      throw new InvalidDap();
    }
    
    const [, handle, domain] = match;
    
    return new Dap(handle, domain);
  }
}

/**
 * Error thrown when an invalid DAP is encountered.
 */
export class InvalidDap extends Error {
  /**
   * Creates a new InvalidDap error.
   * @param message - Optional custom error message. Defaults to 'Invalid DAP'.
   */
  constructor(message?: string) {
    super(message ?? 'Invalid DAP');
    this.name = 'InvalidDap';
  }
}