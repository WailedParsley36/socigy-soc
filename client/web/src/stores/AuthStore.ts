"use client";

import { BASE_API_URL } from "@/constants";
import { apiFetch, includeRequiredHeaders } from "@/lib/apiClient";
import {
  base64,
  base64ToGuid,
  createCredential,
  guidToBytes,
} from "@/lib/PasskeyHelper";
import { AsyncResult } from "@/lib/structures/AsyncResult";
import {
  userDisplayName,
  UserShallowInfo,
} from "@/lib/structures/content/posts/RecommendedPost";
import { Sex } from "@/lib/structures/Enums";
import { ErrorResponse } from "@/lib/structures/ErrorResponse";
import { Guid } from "@/lib/structures/Guid";
import { TokenResponse } from "@/lib/structures/responses/TokenResponse";
import { User } from "@/lib/structures/User";
import { stat } from "fs";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export enum MFAType {
  Email,
  PhoneNumber,
  Authenticator,
  Application,
}

export interface RegisterUserData {
  username: string;
  tag: number;

  email: string;
  fullName: string;
}

export interface AuthState {
  user: User | null;
  tempUserId: Guid | null;
  currentFlowUrl: string | null;

  tokens: TokenResponse | null;
  isInitialized: boolean;

  initialize: () => Promise<boolean>;
  isAuthenticated: () => boolean;

  register: (userData: RegisterUserData) => Promise<AsyncResult<Guid>>;
  submitEmailMfa: (code: string, trust: boolean) => Promise<AsyncResult<Guid>>;
  resendEmailMfa: () => Promise<ErrorResponse | void>;
  refreshUserData: () => Promise<AsyncResult<User>>;
  generatePasskeyLinkChallenge: () => Promise<AsyncResult<string>>;
  registerPasskey: () => Promise<ErrorResponse | undefined>;
  submitRegistrationStep2: (
    birth: Date,
    sex: Sex
  ) => Promise<AsyncResult<boolean>>;

  login: (
    email?: string,
    username?: string,
    tag?: number
  ) => Promise<AsyncResult<User | MFAType>>;

  recoverAccount: (
    email?: string,
    username?: string,
    tag?: number
  ) => Promise<AsyncResult<MFAType>>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshTokens: () => Promise<boolean>;
}

async function antiForgery() {
  await fetch(`${BASE_API_URL}/v1/auth/antiforgery`, {
    credentials: "include",
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      tokens: null,
      user: null,
      tempUserId: null,
      currentFlowUrl: null,

      isAuthenticated() {
        return (
          this.user != null &&
          this.user.registrationComplete == true &&
          this.user.emailVerified == true
        );
      },
      async initialize() {
        let instance = get();
        const response = await apiFetch("/v1/auth/tokens/verify", {
          credentials: "include",
        });

        if (response.status != 200) {
          if (instance.tokens && instance.tokens.refreshExpiry < Date.now()) {
            if (!(await instance.refreshTokens())) {
              set({
                isInitialized: true,
              });
              return false;
            }
          } else {
            set({
              tokens: null,
              user: null,
              currentFlowUrl: null,
              isInitialized: true,
            });
            return false;
          }
        } else {
          const data = (await response.json()) as TokenResponse;
          set({
            tokens: data,
          });
        }

        await get().refreshUserData();
        set({
          isInitialized: true,
        });

        return true;
      },

      async register(userData: RegisterUserData) {
        await antiForgery();
        const response = await apiFetch("/v1/auth/register", {
          method: "POST",
          body: JSON.stringify(userData),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status != 200) return { error: await response.json() };

        const tokens = await response.json();
        set({
          tokens: tokens,
          user: {
            id: tokens.userId,
            tag: userData.tag,
            username: userData.username,
            registrationComplete: false,
            emailVerified: false,
          },
          tempUserId: tokens.userId,
          currentFlowUrl: "/mfa/email?redirectUrl=/register/step-1",
        });
        return { result: tokens.userId };
      },
      async refreshUserData() {
        const response = await apiFetch("/v1/user/me", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status != 200) return { error: await response.json() };

        const userData = (await response.json()) as User;
        userData.displayName = userDisplayName(userData as UserShallowInfo);
        set({
          user: userData,
          tempUserId: userData.id,
        });

        return { result: userData };
      },

      async submitEmailMfa(code: string, trust: boolean) {
        const response = await apiFetch("/v1/auth/mfa/email", {
          method: "POST",
          body: JSON.stringify({
            code: code,
            userId: get().tempUserId,
            trust: trust,
          }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status != 200) return { error: await response.json() };

        const tokens = (await response.json()) as TokenResponse;

        const instance = get();
        set({
          tokens: tokens,
          user: {
            ...instance.user,
            id: tokens.userId,
            emailVerified: true,
          },
          tempUserId: null,
          currentFlowUrl: instance.currentFlowUrl
            ? instance.currentFlowUrl.split("redirectUrl=")[1]
            : null,
        });

        instance
          .refreshUserData()
          .then(() => console.log("Refreshed user data"));
        return { result: tokens.userId };
      },
      async resendEmailMfa() {
        const response = await apiFetch("/v1/auth/mfa/email/resend", {
          method: "POST",
          body: JSON.stringify({ userId: get().tempUserId }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status != 200) return await response.json();
      },

      async generatePasskeyLinkChallenge() {
        const response = await apiFetch("/v1/auth/passkey/link/generate", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status != 200) return { error: await response.json() };

        const challengeResult = await response.json();
        set({
          tokens: {
            ...get().tokens!,
            challenge: challengeResult.challenge as string,
          },
        });

        return { result: challengeResult.challenge };
      },
      async registerPasskey() {
        await antiForgery();

        const instance = get();
        let challenge = instance.tokens?.challenge;
        if (!instance.tokens || !challenge) {
          const result = await instance.generatePasskeyLinkChallenge();
          if (result.error) {
            return result.error;
          }

          challenge = result.result!;
        }

        const credentialRequest = createCredential(
          challenge,
          instance.user!,
          600000
        );

        let passkeyBody;
        try {
          const credential = (await navigator.credentials.create(
            credentialRequest
          )) as PublicKeyCredential;
          const credResponse =
            credential.response as AuthenticatorAttestationResponse;

          passkeyBody = JSON.stringify({
            id: credential.id,
            rawId: base64(credential.rawId),

            type: "public-key",
            response: {
              clientDataJSON: base64(credResponse.clientDataJSON),
              attestationObject: base64(credResponse.attestationObject),
            },
          });
        } catch (e) {
          return {
            message:
              "You need to create passkey to be able to use Socigy. If you can't create the passkey, you can use the 3rd party sign in or try to update your browser",
          };
        }

        const result = await apiFetch("/v1/auth/passkey/link", {
          method: "POST",
          body: passkeyBody,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (result.status != 200) return await result.json();
      },
      async submitRegistrationStep2(birth: Date, sex: Sex) {
        await antiForgery();

        const response = await apiFetch("/v1/user/registration/birth", {
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            birthDate: birth,
            sex: sex != Sex.PreferNotToSay ? Sex[sex].toString() : undefined,
          }),
        });
        if (response.status != 200) return { error: await response.json() };

        const isChild = (await response.json()).isChild;
        set({
          user: {
            ...get().user!,
            sex: sex,
            birthDate: birth,
            isChild: isChild,
          },
        });
        return { result: isChild };
      },
      async submitRegistrationStep3(birth: Date, sex: Sex) {
        await antiForgery();

        const response = await apiFetch("/v1/user/registration/birth", {
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            birthDate: birth,
            sex: sex != Sex.PreferNotToSay ? Sex[sex].toString() : undefined,
          }),
        });
        if (response.status != 200) return { error: await response.json() };
        return { result: false };
      },

      async login(email, username, tag) {
        if (this.user)
          return {
            error: {
              error: "",
              errorCode: 0,
              message: "You are already signed in",
            },
          };

        await antiForgery();

        const challengeResponse = await apiFetch("/v1/auth/challenge/passkey", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email && email.length > 0 ? email : undefined,
            username: username && username.length > 0 ? username : undefined,
            tag: tag,
          }),
        });
        if (challengeResponse.status != 200) {
          if (challengeResponse.status == 404)
            return {
              error: { message: "User not found", error: "", errorCode: -1 },
            };
          return { error: await challengeResponse.json() };
        }

        const data = (await challengeResponse.json()) as {
          challenge: string;
          user: {
            id: string;
            name: string;
            displayName: string;
          };
        };

        const userId = base64ToGuid(data.user.id) as Guid;
        const usernameParts = data.user.displayName.split(" #");

        let credential;
        try {
          credential = await navigator.credentials.get(
            createCredential(
              data.challenge,
              {
                id: userId,
                email: data.user.name,
                username: usernameParts[0],
                tag: parseInt(usernameParts[1]),
              },
              100000
            )
          );
        } catch (e) {
          return {
            error: {
              message: "You've cancelled the login",
              error: "",
              errorCode: -1,
            },
          };
        }
        if (!credential)
          return {
            error: {
              message: "You've cancelled the login",
              error: "",
              errorCode: -1,
            },
          };

        const cred = credential as PublicKeyCredential;
        const credResponse = cred.response as AuthenticatorAssertionResponse;
        const response = await apiFetch("/v1/auth/signIn/passkey", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            credential: {
              id: cred.id,
              rawId: base64(cred.rawId),

              type: "public-key",
              response: {
                clientDataJSON: base64(credResponse.clientDataJSON),
                authenticatorData: base64(credResponse.authenticatorData),
                userHandle: credResponse.userHandle
                  ? base64(credResponse.userHandle)
                  : undefined,
                signature: base64(credResponse.signature),
              },
            },
          }),
        });
        if (response.status != 200) return { error: await response.json() };

        const loginData = await response.json();
        console.log(loginData, loginData.type, loginData.type != undefined);
        if (loginData.type != undefined) {
          set({
            tempUserId: loginData.userId,
          });
          return { result: loginData.type };
        } else {
          set({
            tokens: loginData,
          });

          const userData = await this.refreshUserData();
          if (userData.error) return userData;
          return { result: userData.result };
        }
      },
      async recoverAccount(email, username, tag) {
        if (this.user)
          return {
            error: {
              error: "",
              errorCode: 0,
              message: "You are already signed in",
            },
          };

        await antiForgery();

        const recoveryResponse = await apiFetch("/v1/auth/recover", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email && email.length > 0 ? email : undefined,
            username: username && username.length > 0 ? username : undefined,
            tag: tag,
          }),
        });
        if (recoveryResponse.status != 200)
          return { error: await recoveryResponse.json() };

        const data = await recoveryResponse.json();
        set({
          tempUserId: data.userId,
        });
        return { result: data.type };
      },
      async refreshTokens() {
        const instance = get();
        if (!instance.tokens)
          throw new Error("Your session has expired. Please relogin");

        const response = await fetch(`${BASE_API_URL}/v1/auth/tokens/refresh`, {
          headers: {
            ...includeRequiredHeaders(),
          },
          credentials: "include",
        });
        if (response.status != 200) {
          get().logout();
          return false;
        }

        set({
          tokens: await response.json(),
        });

        return true;
      },

      async logout() {
        await apiFetch("/v1/auth/logout", { credentials: "include" });

        set({
          tokens: null,
          user: null,
        });
      },
      clearError() {},
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        flow: state.currentFlowUrl,
        tokens: state.tokens,
        tempUserId: state.tempUserId,
      }),
    }
  )
);

export default function useAwaitedAuthStore() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const auth = useAuthStore();

  useEffect(() => {
    if (auth.isInitialized) setIsLoaded(true);
  }, [auth]);

  return { isLoaded: isLoaded, auth: auth };
}
