export class Urn {
  private static readonly PREFIX = 'urn:';
  private static readonly SEPARATOR = ':';
  private static readonly URN_PATTERN = new RegExp(`^${Urn.PREFIX}([^${Urn.SEPARATOR}]+)${Urn.SEPARATOR}(.+)$`);

  private readonly urn: string;

  constructor(
    public readonly nid: string,
    public readonly nss: string
  ) {
    this.urn = `${Urn.PREFIX}${nid}:${nss}`;
  }

  toString(): string {
    return this.urn;
  }

  static parse(urn: string): Urn {
    const match = urn.match(Urn.URN_PATTERN);
    if (!match) {
      throw new InvalidUrn();
    }
    
    const [, nid, nss] = match;

    return new Urn(nid, nss);
  }
}

export class InvalidUrn extends Error {
  constructor(message?: string) {
    super(message ?? 'Invalid URN');
    this.name = 'InvalidUrn';
  }
}