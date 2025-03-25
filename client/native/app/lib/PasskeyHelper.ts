import { User } from "./structures/User";

export function base64(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)));
}

export function arrayBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url
    .replace(/-/g, "+") // Replace '-' with '+'
    .replace(/_/g, "/") // Replace '_' with '/'
    .padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "="); // Add padding if necessary

  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

export function guidToBytes(guid: string): ArrayBuffer {
  var bytes: any = [];
  guid.split("-").map((number, index) => {
    var bytesInChar: any =
      index < 3 ? number.match(/.{1,2}/g)?.reverse() : number.match(/.{1,2}/g);
    bytesInChar.map((byte: any) => {
      bytes.push(parseInt(byte, 16));
    });
  });
  return new Uint8Array(bytes).buffer;
}

export function base64ToGuid(base64String: string) {
  // Decode base64 to bytes
  const base64 = base64String
    .replace(/-/g, "+") // Replace '-' with '+'
    .replace(/_/g, "/") // Replace '_' with '/'
    .padEnd(base64String.length + ((4 - (base64String.length % 4)) % 4), "="); // Add padding if necessary

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Format bytes to GUID string
  const hexArray = Array.from(bytes, (byte) => {
    return ("0" + byte.toString(16)).slice(-2);
  });

  // GUID format: 8-4-4-4-12 characters
  return [
    hexArray.slice(0, 4).reverse().join(""),
    hexArray.slice(4, 6).reverse().join(""),
    hexArray.slice(6, 8).reverse().join(""),
    hexArray.slice(8, 10).join(""),
    hexArray.slice(10, 16).join(""),
  ].join("-");
}

export function createCredential(
  challenge: string,
  user: User,
  timeout: number
): CredentialRequestOptions | CredentialCreationOptions | any {
  return {
    publicKey: {
      challenge: arrayBuffer(challenge),
      rp: {
        id: "socigy.com",
        name: "Socigy",
      },
      user: {
        displayName: user.email,
        name: `${user.username} #${user.tag}`,
        id: guidToBytes(user.id),
      },
      pubKeyCredParams: [
        {
          alg: -7,
          type: "public-key",
        },
        {
          alg: -257,
          type: "public-key",
        },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform", // platform (for passkeys) or cross-platform
        requireResidentKey: true, // Requires resident key (discoverable credential)
        userVerification: "required", // User verification must be performed
      },
      timeout: timeout, // Timeout in milliseconds
      attestation: "direct", // Attestation type: "none", "indirect", or "direct"

      // Extensions: Including credProtect
      extensions: {
        credProtect: 0x03, // Use 3 for requiring backup (level 3 protection)
      },
    },
  };
}
