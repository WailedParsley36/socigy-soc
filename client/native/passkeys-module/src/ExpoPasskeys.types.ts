export type Guid = `${string}-${string}-${string}-${string}`

export interface CreatePasskeyResponse {
  id: string
  rawId: string

  type: 'public-key'
  response: {
    clientDataJSON: string,
    attestationObject: string
  }
}

export interface SignInWithPasskeyResponse {
  id: string
  rawId: string

  type: 'public-key'
  response: {
    clientDataJSON: string,
    authenticatorData: string,
    userHandler?: string,
    signature: string
  }
}

export interface Error {
  code: string
}

export type PasskeyUserInfo = {
  id: Guid,
  name: string,
  displayName: string
};

export type PasskeyRpInfo = {
  /** The party domain: example.com / another.example.com */
  id: `${string}.${string}`
  name: string
}