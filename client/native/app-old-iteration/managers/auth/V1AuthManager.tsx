import AppInfo from "@/constants/AppInfo";
import { AppState, BaseManager, LogLevel } from "../BaseManager";
import { ErrorResponse } from "@/data/api/responses/ErrorResponse";
import { createAsync, signInAsync } from "expo-passkeys";
import Constants from "expo-constants";
import { TokenResponse } from "@/data/api/responses/TokenResponse";
import { router, useGlobalSearchParams } from "expo-router";
import {
  PasskeyRpInfo,
  PasskeyUserInfo,
} from "expo-passkeys/build/ExpoPasskeys.types";
import { PasskeyChallengeInfo } from "@/data/api/responses/PasskeyChallengeResponse";
import { AsyncResult } from "@/data/api/responses/AsyncResponse";
import { User } from "@/data/User";
import { Platform } from "react-native";

import * as SecureStore from "expo-secure-store";
import * as Network from "expo-network";

export default class AuthManager extends BaseManager {
  private static tokens?: TokenResponse;
  private tempData?: {
    email?: string;
    phoneNumber?: string;
    username?: string;
    tag?: string;
    redirectToRegistration: boolean;
  };
  private static singletonInstance: AuthManager;

  setRootState?: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser?: User;

  constructor() {
    super("AuthManager", "v1.0.0");
    AuthManager.singletonInstance = this;
  }

  async initializeAsync(
    logLevel: LogLevel,
    updateState: (state: AppState) => void
  ): Promise<AppState> {
    this.logger._setLogLevel(logLevel);
    this.updateState = updateState;

    const state = await this.initializeTokens();
    this.logger.info("Initialized with state:", AppState[state]);
    this.setRootState!(true);
    return state;
  }

  isValidEmail(email: string | undefined): boolean {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  //#region Service Health
  async healthCheck(): Promise<boolean> {
    return (
      (await fetch(`${AppInfo.servers.auth}/_status/healthz`)).status == 200
    );
  }
  //#endregion

  async signInChallengeAsync(
    email?: string,
    username?: string,
    tag?: string,
    phoneNumber?: string
  ): Promise<AsyncResult<PasskeyChallengeInfo>> {
    const challengeResponse = await fetch(
      `${AppInfo.servers.auth}/login/challenge`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          username: username,
          tag: tag,
          phoneNumber: phoneNumber,
        }),
      }
    );
    let result = await challengeResponse.json();
    if (challengeResponse.status != 200) return { error: result };

    if (result.error && result.result) {
      // Sign in and the redirect to registration
      this.tempData = {
        email: email,
        username: username,
        tag: tag,
        phoneNumber: phoneNumber,
        redirectToRegistration: true,
      };
      result = result.result;
      this.logger.info("Result", result);
    } else
      this.tempData = {
        email: email,
        username: username,
        tag: tag,
        phoneNumber: phoneNumber,
        redirectToRegistration: false,
      };

    if (result.mfaTokens) {
      await this.handleTokenResponse(result.mfaTokens);
      return { result: { mfaRequired: true } };
    }

    return { result: { ...result, mfaRequired: false } };
  }

  async signInAsync(
    challengeInfo: PasskeyChallengeInfo
  ): Promise<AsyncResult<{ mfa: boolean; registration: boolean }>> {
    this.logger.info("Challenge", challengeInfo.challenge);
    const passkeyResult = await signInAsync(
      challengeInfo.challenge!,
      challengeInfo.user!,
      challengeInfo.relayingParty!,
      30000
    );
    if (passkeyResult.error || !passkeyResult.result) {
      return {
        error: {
          error: passkeyResult.error!.code,
          message: passkeyResult.error!.code,
          errorCode: -999,
        },
      };
    }

    const response = await fetch(`${AppInfo.servers.auth}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: passkeyResult.result,
        userId: challengeInfo.user!.id,
      }),
    });
    const result = await response.json();
    if (response.status != 200) return { error: result };

    await this.handleTokenResponse(result);

    return {
      result: {
        mfa: result.mfaOnly,
        registration: this.tempData!.redirectToRegistration,
      },
    };
  }

  async logOutAsync() {
    if (Platform.OS != "web") {
      await this.deleteSavedTokens();
      return;
    }

    const response = await fetch(`${AppInfo.servers.auth}/logout`, {
      credentials: "include",
    });
    if (response.status != 200) {
      this.logger.error("Failed to logout");
      return;
    }

    await this.deleteSavedTokens();
  }

  //#region Registration
  //#region Step 1
  async registerBasic(
    username: string,
    tag: number,
    fullName: string,
    email: string
  ): Promise<AsyncResult<PasskeyChallengeInfo>> {
    const response = await fetch(AppInfo.servers.auth + "/register/basic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        tag: tag,
        fullName: fullName,
      }),
    });
    if (response.status != 200) {
      return { error: await response.json() };
    }

    const result = await response.json();
    await this.handleTokenResponse(result.tokens);

    this.tempData = {
      email: email,
      username: username,
      tag: tag.toString().padStart(4, "0"),
    };
    return { result: result.passkey };
  }

  async registerPasskeyAsync(
    challenge: string,
    user: PasskeyUserInfo,
    rp: PasskeyRpInfo,
    timeout: number = 30000
  ): Promise<ErrorResponse | undefined> {
    const result = await createAsync(challenge, user, rp, timeout);
    if (result.error != null)
      return { error: result.error.code, message: "", errorCode: -999 };

    const response = await fetch(AppInfo.servers.auth + "/register/passkey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.result!),
    });
    if (response.status != 200) return await response.json();
  }

  async checkTagAvailability(
    username: string | undefined,
    tag: string | undefined
  ): Promise<boolean | undefined> {
    const response = await fetch(
      AppInfo.servers.auth +
        `/register/tag/exists?username=${username}&tag=${tag}`
    );
    if (response.status != 200) return undefined;

    return (await response.text()) == "true";
  }

  async recommendTags(
    username: string | undefined,
    count: number
  ): Promise<string[] | undefined> {
    const response = await fetch(
      AppInfo.servers.auth +
        `/register/tag/recommendation?username=${username}&count=${count}`
    );
    if (response.status != 200) return undefined;

    return await response.json();
  }
  //#endregion
  //#region Step 2
  async registerBirthAndGender(
    birth: Date,
    gender: string
  ): Promise<AsyncResult<boolean>> {
    const response = await fetch(AppInfo.servers.auth + `/register/extended`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gender: gender,
        birthDate: birth,
      }),
    });
    if (response.status != 200) return { error: await response.json() };

    const result = await response.json();
    return { result: result.needsParentAcknowledgement };
  }
  //#endregion
  async completeRegistration(
    appComplexity?: string
  ): Promise<ErrorResponse | undefined> {
    const response = await fetch(
      AppInfo.servers.auth +
        (appComplexity
          ? `/register/complete?appComplexity=${appComplexity}`
          : "/register/complete")
    );
    if (response.status != 200) return await response.json();

    return;
  }
  //#endregion

  //#region MFA
  async verifyEmailWithCode(
    code: string,
    trustThisDevice: boolean,
    email?: string
  ): Promise<ErrorResponse | undefined> {
    const response = await fetch(
      AppInfo.servers.auth +
        `/verify/email?email=${
          email ?? this.tempData?.email
        }&code=${code}&trust=${trustThisDevice}`
    );
    if (response.status != 200) return await response.json();

    await this.handleTokenResponse((await response.json()) as TokenResponse);
    return;
  }
  async resendEmailCode(email?: string): Promise<ErrorResponse | undefined> {
    const response = await fetch(
      AppInfo.servers.auth + `/verify?email=${email ?? this.tempData?.email}`
    );
    if (response.status != 200) return await response.json();

    return;
  }
  //#endregion

  //#region Tokens
  private static readonly _accessTokenKey = "auth.tokens.accessToken";
  private static readonly _refreshTokenKey = "auth.tokens.refreshToken";
  private static readonly _mfaOnlyToken = "auth.tokens.mfaOnly";
  private async initializeTokens(): Promise<AppState> {
    // Setting the authorized fetch replacement
    if (!global.unauthorizedFetch) {
      this.logger.debug("Registering authorized fetch globally");
      global.unauthorizedFetch = global.fetch;
      global.fetch = this.authorizedFetch;
    }

    if (Platform.OS == "web") {
      this.logger.info("Initializing tokens for web");
      return await this.initializeWebTokens();
    }

    // await SecureStore.setItemAsync(`${AuthManager._refreshTokenKey}`, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI5MzdhNmFiMi05N2UzLTQwYjYtYTc4Ny01OTZiMWM0NDI1MDYiLCJuYW1lIjoiMCIsIm1mYV9vbmx5IjoiRmFsc2UiLCJpc3MiOiJzb2NpZ3ktaXNzdWVyIiwiYXVkIjpbInNvY2lneS1hcHAiLCJzb2NpZ3ktYXBwIl0sIm5iZiI6MTczNTIxMjQ4NSwiZXhwIjoxNzM3ODA0NDg1LCJpYXQiOjE3MzUyMTI0ODV9.yR2kwGV4mhClJu4iNbSSLd_-h3s6dmiope9e21PWnx0');
    // await SecureStore.setItemAsync(`${AuthManager._refreshTokenKey}.expiry`, 'Fri, 24 Jan 2025 21:41:14 GMT');
    // await SecureStore.setItemAsync(`${AuthManager._mfaOnlyToken}`, 'false');

    //! THIS SHOULD NOT BE HERE - DEBUG ONLY
    // this.deleteSavedTokens()
    // return AppState.Authorized;

    this.logger.debug("Initializing tokens for " + Platform.OS);
    const accessExpiryString = await SecureStore.getItemAsync(
      `${AuthManager._accessTokenKey}.expiry`
    );
    const refreshExpiryString = await SecureStore.getItemAsync(
      `${AuthManager._refreshTokenKey}.expiry`
    );
    this.logger.debug(
      "Loaded tokens. Access:",
      accessExpiryString,
      "Refresh:",
      refreshExpiryString
    );

    // Tokens were not saved
    if (!accessExpiryString && !refreshExpiryString)
      return AppState.Unauthorized;

    const accessExpiry = accessExpiryString
      ? new Date(accessExpiryString)
      : new Date(Date.now());
    const refreshExpiry = refreshExpiryString
      ? new Date(refreshExpiryString)
      : new Date(Date.now());
    this.logger.debug("Token expiry found", accessExpiry, refreshExpiry);

    let mfaOnly: boolean | string | undefined = (await SecureStore.getItemAsync(
      AuthManager._mfaOnlyToken
    )) as string | undefined | boolean;
    if (!mfaOnly) return AppState.Unauthorized;

    mfaOnly = JSON.parse(mfaOnly as string) as boolean;

    this.logger.debug("MFA only:", mfaOnly);
    const accessToken = await SecureStore.getItemAsync(
      AuthManager._accessTokenKey
    );
    const refreshToken = await SecureStore.getItemAsync(
      AuthManager._refreshTokenKey
    );
    AuthManager.tokens = {
      accessTokenExpiry: accessExpiry,
      refreshTokenExpiry: refreshExpiry,
      refreshToken: refreshToken!,
      accessToken: accessToken!,
      mfaOnly: mfaOnly,
    };

    const response = await fetch(`${AppInfo.servers.auth}/tokens/check`, {
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
      credentials: "include",
    });
    if (response.status != 200) return await this.refreshTokens();

    const res = await response.json();
    if (
      typeof res.accessTokenExpiry === "string" ||
      res.accessTokenExpiry instanceof String
    ) {
      res.accessTokenExpiry = new Date(res.accessTokenExpiry);
      res.refreshTokenExpiry = new Date(res.refreshTokenExpiry);
    }

    res.accessToken = accessToken;
    res.refreshToken = refreshToken;
    this.handleTokenResponse(res, false);

    this.currentUser = res.tokenUser;

    return this.currentUser?.registered
      ? AppState.Authorized
      : AppState.NotRegistered;
  }

  private async initializeWebTokens(): Promise<AppState> {
    const response = await fetch(`${AppInfo.servers.auth}/tokens/check`, {
      credentials: "include",
    });
    if (response.status != 200) return await this.refreshTokens();

    const res = await response.json();
    if (
      typeof res.accessTokenExpiry === "string" ||
      res.accessTokenExpiry instanceof String
    ) {
      res.accessTokenExpiry = new Date(res.accessTokenExpiry);
      res.refreshTokenExpiry = new Date(res.refreshTokenExpiry);
    }
    this.handleTokenResponse(res, false);

    this.currentUser = res.tokenUser;

    return this.currentUser?.registered
      ? AppState.Authorized
      : AppState.NotRegistered;
  }

  private async handleTokenResponse(
    tokenResponse: TokenResponse,
    updateState: boolean = true
  ) {
    try {
      if (
        typeof tokenResponse.accessTokenExpiry === "string" ||
        tokenResponse.accessTokenExpiry instanceof String
      ) {
        tokenResponse.accessTokenExpiry = new Date(
          tokenResponse.accessTokenExpiry
        );
        tokenResponse.refreshTokenExpiry = new Date(
          tokenResponse.refreshTokenExpiry
        );
      }
      AuthManager.tokens = tokenResponse;

      if (Platform.OS != "web") {
        await SecureStore.setItemAsync(
          `${AuthManager._accessTokenKey}.expiry`,
          tokenResponse.accessTokenExpiry.toUTCString()
        );
        await SecureStore.setItemAsync(
          `${AuthManager._refreshTokenKey}.expiry`,
          tokenResponse.refreshTokenExpiry.toUTCString()
        );

        await SecureStore.setItemAsync(
          AuthManager._accessTokenKey,
          tokenResponse.accessToken!
        );
        await SecureStore.setItemAsync(
          AuthManager._refreshTokenKey,
          tokenResponse.refreshToken!
        );

        await SecureStore.setItemAsync(
          AuthManager._mfaOnlyToken,
          tokenResponse.mfaOnly ? "true" : "false"
        );
      }

      this.logger.debug("New Auth tokens registered");

      if (updateState)
        this.updateState(
          tokenResponse.mfaOnly ? AppState.MFA : AppState.Authorized
        );
    } catch (e) {
      console.error("TOKEN RESPONSE ERROR", e);
    }
  }

  private async authorizedFetch(
    input: string | URL | RequestInfo,
    init?: RequestInit | undefined
  ): Promise<Response> {
    function getCookieHeader() {
      const existingCookies =
        init?.headers && typeof init.headers === "object"
          ? (init.headers as Record<string, string>)["Cookie"] || ""
          : "";

      const newCookie = `accessToken=${AuthManager.tokens?.accessToken}`;
      return existingCookies ? `${existingCookies}; ${newCookie}` : newCookie;
    }

    if (init) init.credentials = "include";

    if (!AuthManager.tokens) return await global.unauthorizedFetch(input, init);

    if (
      AuthManager.tokens.accessTokenExpiry <
      new Date(Date.now() + 120000 /* 2 minute offset before token expires */)
    ) {
      console.log(
        "AuthManager(v1.0.0) - Authorized fetch is refreshing tokens (2 minute offset was triggered)"
      );
      await AuthManager.singletonInstance.refreshTokens();
    }

    return await global.unauthorizedFetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        Cookie: getCookieHeader(),
      },
      credentials: init?.credentials ?? "include",
    });
  }

  async refreshTokens(updateState: boolean = true): Promise<AppState> {
    this.logger.info("Refreshing tokens");

    if (
      Platform.OS != "web" &&
      (!AuthManager.tokens ||
        !AuthManager.tokens.refreshToken ||
        AuthManager.tokens.refreshTokenExpiry < new Date(Date.now()))
    ) {
      await this.deleteSavedTokens(updateState);
      this.logger.info(
        "Refreshing tokens was aborted - No valid refresh token"
      );
      return AppState.Unauthorized;
    }

    let response;
    if (Platform.OS != "web") {
      const inetResult = await Network.getNetworkStateAsync();
      if (!inetResult.isInternetReachable) {
        this.logger.info("The DEVICE is OFFLINE");
      }

      response = await global.unauthorizedFetch(
        AppInfo.servers.auth + "/tokens/refresh?mobile=true",
        {
          headers: {
            Cookie: `refreshToken=${AuthManager.tokens!.refreshToken}`,
          },
          credentials: "include",
        }
      );

      if (!inetResult.isInternetReachable && response.status != 200) {
        return AppState.Offline;
      }
    } else {
      response = await global.unauthorizedFetch(
        AppInfo.servers.auth + "/tokens/refresh",
        {
          credentials: "include",
          signal: AbortSignal.timeout(2500),
        }
      );
    }

    if (response.status != 200) {
      this.logger.debug("Invalid refresh token");
      await this.deleteSavedTokens(updateState);
      return AppState.Unauthorized;
    }
    if (!response) {
      this.logger.error("Response is UNDEFINED", response);
      return AppState.Unauthorized;
    }

    try {
      const result = (await response.json()) as TokenResponse;
      await this.handleTokenResponse(result, updateState);
      return result.mfaOnly ? AppState.MFA : AppState.Authorized;
    } catch (e) {
      return AppState.Unauthorized;
    }
  }

  private async deleteSavedTokens(updateState: boolean = true) {
    AuthManager.tokens = undefined;

    if (Platform.OS != "web") {
      await SecureStore.deleteItemAsync(
        `${AuthManager._accessTokenKey}.expiry`
      );
      await SecureStore.deleteItemAsync(AuthManager._accessTokenKey);

      await SecureStore.deleteItemAsync(
        `${AuthManager._refreshTokenKey}.expiry`
      );
      await SecureStore.deleteItemAsync(AuthManager._refreshTokenKey);

      await SecureStore.deleteItemAsync(AuthManager._mfaOnlyToken);
    }

    if (updateState) this.updateState(AppState.Unauthorized);
  }
  //#endregion

  //#region QR Codes
  async getAnonymousQrCode(): Promise<AsyncResult<string>> {
    return { result: "" };
  }

  async getUserQrCode(): Promise<AsyncResult<string>> {
    return { result: "" };
  }

  async scanQrCode(token: string): Promise<ErrorResponse | undefined> {
    return undefined;
  }
  //#endregion
}
