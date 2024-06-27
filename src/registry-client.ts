import type { DapRegistration, ErrorResponse, RegistrationResponse } from './registration';

export class DapRegistryClient {
  registryBaseUrl: string;

  constructor(url: string) {
    this.registryBaseUrl = new URL(url).origin;
  }

  async register(registration: DapRegistration): Promise<RegistrationResponse | ErrorResponse> {
    const response = await fetch(`${this.registryBaseUrl}/daps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registration),
    });

    return await response.json();
  }
}