import { CreatePasskeyResponse, Guid, PasskeyRpInfo, PasskeyUserInfo, SignInWithPasskeyResponse } from './ExpoPasskeys.types';

function base64(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)));
}

function arrayBuffer(base64Url: string): ArrayBuffer {
  // Convert Base64URL to standard Base64
  const base64 = base64Url
    .replace(/-/g, '+') // Replace '-' with '+'
    .replace(/_/g, '/') // Replace '_' with '/'
    .padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, '='); // Add padding if necessary

    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}

function guidToBytes(guid: string): ArrayBuffer {
  var bytes: any = [];
  guid.split('-').map((number, index) => {
    var bytesInChar: any = index < 3 ? number.match(/.{1,2}/g)?.reverse() : number.match(/.{1,2}/g);
    bytesInChar.map((byte) => { bytes.push(parseInt(byte, 16)); })
  });
  return new Uint8Array(bytes).buffer;
}

function createCredential(challenge: string, user: PasskeyUserInfo, rp: PasskeyRpInfo, timeout: number): CredentialRequestOptions | CredentialCreationOptions | any {
  return {
    publicKey: {
      challenge: arrayBuffer(challenge),
      rp: rp,
      user: {
        displayName: user.displayName,
        name: user.name,
        id: guidToBytes(user.id)
      },
      pubKeyCredParams: [
        {
          alg: -7,
          type: "public-key"
        },
        {
          alg: -257,
          type: "public-key"
        }
      ],
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform", // platform (for passkeys) or cross-platform
        requireResidentKey: true,            // Requires resident key (discoverable credential)
        userVerification: "required"         // User verification must be performed
      },
      timeout: timeout,  // Timeout in milliseconds
      attestation: "direct",  // Attestation type: "none", "indirect", or "direct"

      // Extensions: Including credProtect
      extensions: {
        credProtect: 0x03 // Use 3 for requiring backup (level 3 protection)
      }
    }
  }
}

export default {
  async createAsync(challenge: string, user: PasskeyUserInfo, rp: PasskeyRpInfo, timeout: number): Promise<string> {
    const credential = await navigator.credentials.create(createCredential(challenge, user, rp, timeout) as CredentialCreationOptions);

    if (credential == null)
      throw new Error("Failed to create new passkey");

    const cred = credential as PublicKeyCredential;
    const credResponse = cred.response as AuthenticatorAttestationResponse;
    return JSON.stringify({
      id: cred.id,
      rawId: base64(cred.rawId),

      type: 'public-key',
      response: {
        clientDataJSON: base64(credResponse.clientDataJSON),
        attestationObject: base64(credResponse.attestationObject)
      }
    });
  },
  async signInAsync(challenge: string, user: PasskeyUserInfo, rp: PasskeyRpInfo, timeout: number): Promise<string> {
    const credential = await navigator.credentials.get(createCredential(challenge, user, rp, timeout))

    if (credential == null)
      throw new Error("Failed to get users passkey");

    const cred = credential as PublicKeyCredential;
    const credResponse = cred.response as AuthenticatorAssertionResponse;
    return JSON.stringify({
      id: cred.id,
      rawId: base64(cred.rawId),

      type: 'public-key',
      response: {
        clientDataJSON: base64(credResponse.clientDataJSON),
        authenticatorData: base64(credResponse.authenticatorData),
        userHandler: credResponse.userHandle ? base64(credResponse.userHandle) : undefined,
        signature: base64(credResponse.signature)
      }
    });
  },

  isSupported(): boolean {
    return window?.PublicKeyCredential !== undefined && typeof window.PublicKeyCredential === "function";
  },
  async isAutoFillSupportedAsync(): Promise<boolean> {
    return window.PublicKeyCredential && window.PublicKeyCredential.isConditionalMediationAvailable();
  }

};
