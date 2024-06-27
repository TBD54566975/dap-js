import { DidDht, DidJwk, DidWeb, UniversalResolver } from '@web5/dids';

export const DidResolver = new UniversalResolver({
  didResolvers: [DidDht, DidJwk, DidWeb]
})