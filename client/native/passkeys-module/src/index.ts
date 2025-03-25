import ExpoPasskeysModule from './ExpoPasskeysModule';
import { CreatePasskeyResponse, Error, PasskeyRpInfo, PasskeyUserInfo, SignInWithPasskeyResponse } from './ExpoPasskeys.types';

export async function createAsync(challenge: string, user: PasskeyUserInfo, rp: PasskeyRpInfo, timeout: number): Promise<{ error?: Error, result?: CreatePasskeyResponse }> {
  try {
    const passkeyResult = await ExpoPasskeysModule.createAsync(challenge, user, rp, timeout);
    return { result: JSON.parse(passkeyResult) as CreatePasskeyResponse };
  }
  catch (e) {
    return { error: e }
  }
}

export async function signInAsync(challenge: string, user: PasskeyUserInfo, rp: PasskeyRpInfo, timeout: number): Promise<{ error?: Error, result?: SignInWithPasskeyResponse }> {
  try {
    const passkeyResult = await ExpoPasskeysModule.signInAsync(challenge, user, rp, timeout);
    return { result: JSON.parse(passkeyResult) as SignInWithPasskeyResponse };
  }
  catch (e) {
    return { error: e }
  }
}

export async function isAutoFillSupported(): Promise<boolean> {
  return await ExpoPasskeysModule.isAutoFillSupportedAsync();
}

export function isSupported(): boolean {
  return ExpoPasskeysModule.isSupported();
}