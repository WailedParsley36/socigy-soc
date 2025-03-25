import { BASE_API_URL } from "@/constants";
import { apiFetch, apiFetchRaw, includeRequiredHeaders } from "@/lib/apiClient";
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
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsync, signInAsync } from "expo-passkeys";
import { Alert, Platform } from "react-native";
import * as Device from "expo-device";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { startMapper } from "react-native-reanimated";
import { set } from "date-fns";

// export const zustandStorage = createJSONStorage(() => ({
//   setItem: async (name, value) => {
//     return await AsyncStorage.setItem(name, JSON.stringify(value));
//   },
//   getItem: async (name) => {
//     const value = await AsyncStorage.getItem(name);
//     return value ? JSON.parse(value) : null;
//   },
//   removeItem: async (name) => {
//     return await AsyncStorage.removeItem(name);
//   },
// }));

// export const expoSecureStorage = {
//   setItem: async (key: string, value: string) => await setItemAsync(key, value),
//   getItem: async (key: string) => (await getItemAsync(key)) as Promise<string> | null,
//   removeItem: async (key: string) => await deleteItemAsync(key),
// }

function base64ToBase64Url(base64String: string) {
  return base64String
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

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

async function antiForgery() {}

export interface AuthState {
  isInitialized: boolean;
  tokens: TokenResponse | null;
  user: User | null;
  tempUserId: Guid | null;
  currentFlowUrl: string | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: () => boolean;
  initialize: () => Promise<boolean>;

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

export const AuthContext = createContext<AuthContextType | null>(null);

const userAgent = `Mozilla/5.0 (${Platform.OS}; ${Device.osName || "Unknown"} ${
  Device.osVersion || "Unknown"
}; ${Device.manufacturer} ${Device.modelName} Build/${
  Device.osBuildId
}) Socigy/1.0.0 (KHTML, like Gecko)`;
export function AuthProvider({ children }: any) {
  const [state, setState] = useState<AuthState>({
    isInitialized: false,
    tokens: null,
    user: null,
    tempUserId: null,
    currentFlowUrl: null,
  });

  const originalFetch = useRef(globalThis.fetch);

  useEffect(() => {
    globalThis.fetch = async (url, options) => {
      if (!options) options = {};
      if (!options.headers) options.headers = {};
      options.headers = {
        ...options.headers,
        "User-Agent": userAgent,
        Cookie: `${
          state.tokens?.accessToken ? `Access=${state.tokens.accessToken};` : ""
        }${
          state.tokens?.refreshToken
            ? `Refresh=${state.tokens.refreshToken};`
            : ""
        }`,
      };
      // @ts-ignore
      return await originalFetch.current(url, options);
    };
    // @ts-ignore
    globalThis.baseFetch = originalFetch.current;

    return () => {
      globalThis.fetch = originalFetch.current;
    };
  }, [state.tokens]);

  useEffect(() => {
    const loadPersistedData = async () => {
      let parsedData: AuthState | undefined;
      try {
        const persistedData = await AsyncStorage.getItem("auth-storage");
        if (persistedData) {
          parsedData = JSON.parse(persistedData);
          setState((prevState) => ({
            ...prevState,
            ...parsedData,
          }));
        } else {
          setState((prevState) => ({
            ...prevState,
          }));
        }
      } catch (error) {
        console.error("Failed to load persisted auth data:", error);
        setState((prevState) => ({
          ...prevState,
        }));
      }

      if (!state.isInitialized) {
        await initialize(parsedData!);
      }
    };

    loadPersistedData();
  }, []);

  useEffect(() => {
    const persistData = async () => {
      try {
        const dataToStore = {
          tokens: state.tokens,
          user: state.user,
          tempUserId: state.tempUserId,
          currentFlowUrl: state.currentFlowUrl,
        };
        await AsyncStorage.setItem("auth-storage", JSON.stringify(dataToStore));
      } catch (error) {
        console.error("Failed to persist auth data:", error);
      }
    };

    persistData();
  }, [state.tokens, state.user, state.tempUserId, state.currentFlowUrl]);

  const isAuthenticated = () => {
    return (
      state.user != null &&
      state.user.registrationComplete === true &&
      state.user.emailVerified === true
    );
  };

  const initialize = async (instance?: AuthState): Promise<boolean> => {
    if (!instance) {
      setState((prev) => ({
        ...prev,
        isInitialized: true,
      }));
      return false;
    }

    const response = await apiFetchRaw(
      originalFetch.current,
      "/v1/auth/tokens/verify",
      instance.tokens!,
      {
        credentials: "include",
      }
    );

    if (response.status != 200) {
      if (instance.tokens && instance.tokens.refreshExpiry < Date.now()) {
        if (!(await refreshTokensRaw(instance.tokens))) {
          setState((prev) => ({
            ...prev,
            isInitialized: true,
          }));
          return false;
        }
      } else {
        setState((prev) => ({
          ...prev,
          tokens: null,
          user: null,
          currentFlowUrl: null,
          isInitialized: true,
        }));
        return false;
      }
    } else {
      const data = (await response.json()) as TokenResponse;
      setState((prev) => ({
        ...prev,
        tokens: {
          ...prev.tokens!,
          refreshExpiry: data.refreshExpiry,
          accessExpiry: data.accessExpiry,
          userId: data.userId,
        },
      }));
      await refreshUserDataRaw(instance.tokens!);
    }

    setState((prev) => ({
      ...prev,
      isInitialized: true,
    }));

    return true;
  };

  const register = async (
    userData: RegisterUserData
  ): Promise<AsyncResult<Guid>> => {
    try {
      await antiForgery();
      const response = await apiFetch("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) return { error: await response.json() };

      const tokens = await response.json();
      console.log("REGISTRATION-TOKENS-", tokens, JSON.stringify(tokens));
      setState((prevState) => ({
        ...prevState,
        tokens: tokens,
        user: {
          id: tokens.userId,
          tag: userData.tag,
          username: userData.username,
          registrationComplete: false,
          emailVerified: false,
        },
        tempUserId: tokens.userId,
        currentFlowUrl:
          "/(auth)/(mfa)/email?redirectUrl=/(auth)/(register)/step-1",
      }));

      return { result: tokens.userId };
    } catch (error) {
      console.error("Registration failed:", error);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const submitEmailMfa = async (
    code: string,
    trust: boolean
  ): Promise<AsyncResult<Guid>> => {
    try {
      const response = await apiFetch("/v1/auth/mfa/email", {
        method: "POST",
        body: JSON.stringify({
          code: code,
          userId: state.tempUserId,
          trust: trust,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) return { error: await response.json() };

      const tokens = (await response.json()) as TokenResponse;

      const currentUser = state.user;
      const currentFlowUrl = state.currentFlowUrl;

      setState((prevState) => ({
        ...prevState,
        tokens: tokens,
        user: {
          ...currentUser,
          id: tokens.userId,
          emailVerified: true,
        },
        tempUserId: null,
        currentFlowUrl: currentFlowUrl
          ? currentFlowUrl.split("redirectUrl=")[1]
          : null,
      }));

      refreshUserDataRaw(tokens).then(() => console.log("Refreshed user data"));
      return { result: tokens.userId };
    } catch (error) {
      console.error("MFA submission failed:", error);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const resendEmailMfa = async (): Promise<ErrorResponse | void> => {
    try {
      const response = await apiFetch("/v1/auth/mfa/email/resend", {
        method: "POST",
        body: JSON.stringify({ userId: state.tempUserId }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) return await response.json();
    } catch (error) {
      console.error("Failed to resend MFA email:", error);
      return { message: "An unexpected error occurred" };
    }
  };

  const refreshUserData = async (): Promise<AsyncResult<User>> => {
    try {
      const response = await apiFetch("/v1/user/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) return { error: await response.json() };

      const userData = (await response.json()) as User;
      userData.displayName = userDisplayName(userData as UserShallowInfo);

      setState((prevState) => ({
        ...prevState,
        user: userData,
        tempUserId: userData.id,
      }));

      return { result: userData };
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return { error: { message: "Failed to load user data" } };
    }
  };
  const refreshUserDataRaw = async (
    tokens: TokenResponse
  ): Promise<AsyncResult<User>> => {
    try {
      const response = await apiFetchRaw(
        originalFetch.current,
        "/v1/user/me",
        tokens,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200)
        return { error: { message: await response.text() } };

      const userData = (await response.json()) as User;
      userData.displayName = userDisplayName(userData as UserShallowInfo);

      setState((prevState) => ({
        ...prevState,
        user: userData,
        tempUserId: userData.id,
      }));

      return { result: userData };
    } catch (error) {
      console.error("Failed to refresh RAW user data:", error);
      return { error: { message: "Failed to load user data" } };
    }
  };

  const generatePasskeyLinkChallenge = async (): Promise<
    AsyncResult<string>
  > => {
    try {
      const response = await apiFetch("/v1/auth/passkey/link/generate", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) return { error: await response.json() };

      const challengeResult = await response.json();

      setState((prevState) => ({
        ...prevState,
        tokens: {
          ...prevState.tokens!,
          challenge: challengeResult.challenge as string,
        },
      }));

      return { result: challengeResult.challenge };
    } catch (error) {
      console.error("Failed to generate passkey challenge:", error);
      return { error: { message: "Failed to generate challenge" } };
    }
  };

  const registerPasskey = async (): Promise<ErrorResponse | undefined> => {
    try {
      await antiForgery();

      let challenge = state.tokens?.challenge;
      if (!state.tokens || !challenge) {
        const result = await generatePasskeyLinkChallenge();
        if (result.error) {
          return result.error;
        }

        challenge = result.result!;
      }

      const response = await createAsync(
        base64ToBase64Url(challenge),
        {
          displayName: state.user!.email!,
          name: `${state.user!.username} #${state.user!.tag}`,
          id: state.user!.id,
        },
        {
          id: "socigy.com",
          name: "Socigy",
        },
        100000
      );
      if (response.error)
        return {
          message:
            "You need to create passkey to be able to use Socigy. If you can't create the passkey, you can use the 3rd party sign in or try to update your browser",
        };

      const result = await apiFetch("/v1/auth/passkey/link", {
        method: "POST",
        body: JSON.stringify(response.result!),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (result.status !== 200) return await result.json();
    } catch (error) {
      console.error("Failed to register passkey:", error);
      return { message: "Failed to register passkey" };
    }
  };

  const submitRegistrationStep2 = async (
    birth: Date,
    sex: Sex
  ): Promise<AsyncResult<boolean>> => {
    try {
      await antiForgery();

      const response = await apiFetch("/v1/user/registration/birth", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birthDate: birth,
          sex: sex !== Sex.PreferNotToSay ? Sex[sex].toString() : undefined,
        }),
      });

      if (response.status !== 200) return { error: await response.json() };

      const isChild = (await response.json()).isChild;

      setState((prevState) => ({
        ...prevState,
        user: {
          ...prevState.user!,
          sex: sex,
          birthDate: birth,
          isChild: isChild,
        },
      }));

      return { result: isChild };
    } catch (error) {
      console.error("Failed to submit registration step 2:", error);
      return { error: { message: "Failed to update profile" } };
    }
  };

  const login = async (
    email?: string,
    username?: string,
    tag?: number
  ): Promise<AsyncResult<User | MFAType>> => {
    try {
      if (state.user)
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

      if (challengeResponse.status !== 200) {
        if (challengeResponse.status === 404)
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
        rp: {
          id: string;
          name: string;
        };
      };

      let credential;
      try {
        const response = await signInAsync(
          base64ToBase64Url(data.challenge),
          {
            displayName: data.user.displayName,
            name: data.user.name,
            id: data.user.id as Guid,
          },
          data.rp as any,
          100000
        );
        if (response.error) throw new Error(response.error.code);
        credential = response.result!;
      } catch (e) {
        console.error(e);
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

      const userId = base64ToGuid(data.user.id) as Guid;
      const response = await apiFetch("/v1/auth/signIn/passkey", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credential,
          userId: userId,
        }),
      });

      if (response.status !== 200) return { error: await response.json() };

      const loginData = await response.json();
      if (loginData.type !== undefined) {
        setState((prevState) => ({
          ...prevState,
          tempUserId: loginData.userId,
        }));
        return { result: loginData.type };
      } else {
        setState((prevState) => ({
          ...prevState,
          tempUserId: loginData.userId,
          tokens: loginData,
        }));

        const userData = await refreshUserDataRaw(loginData);
        if (userData.error) return userData;
        return { result: userData.result! };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return {
        error: { message: "An unexpected error occurred during login" },
      };
    }
  };

  const recoverAccount = async (
    email?: string,
    username?: string,
    tag?: number
  ): Promise<AsyncResult<MFAType>> => {
    try {
      if (state.user)
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

      if (recoveryResponse.status !== 200)
        return { error: await recoveryResponse.json() };

      const data = await recoveryResponse.json();

      setState((prevState) => ({
        ...prevState,
        tempUserId: data.userId,
      }));

      return { result: data.type };
    } catch (error) {
      console.error("Account recovery failed:", error);
      return { error: { message: "Failed to recover account" } };
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
    try {
      if (!state.tokens)
        throw new Error("Your session has expired. Please relogin");

      const response = await fetch(`${BASE_API_URL}/v1/auth/tokens/refresh`, {
        headers: {
          ...includeRequiredHeaders(),
        },
        credentials: "include",
      });

      if (response.status !== 200) {
        logout();
        return false;
      }

      const newTokens = await response.json();
      setState((prevState) => ({
        ...prevState,
        tokens: newTokens,
      }));

      return true;
    } catch (error) {
      console.error("Failed to refresh tokens:", error);
      logout();
      return false;
    }
  };
  const refreshTokensRaw = async (tokens: TokenResponse): Promise<boolean> => {
    try {
      const response = await apiFetchRaw(
        originalFetch.current,
        `${BASE_API_URL}/v1/auth/tokens/refresh`,
        tokens,
        {
          headers: {
            ...includeRequiredHeaders(),
          },
          credentials: "include",
        }
      );

      if (response.status !== 200) {
        logout();
        return false;
      }

      const newTokens = await response.json();
      setState((prevState) => ({
        ...prevState,
        tokens: newTokens,
      }));

      return true;
    } catch (error) {
      console.error("Failed to refresh tokens:", error);
      logout();
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiFetch("/v1/auth/logout", { credentials: "include" });

      setState((prevState) => ({
        ...prevState,
        tokens: null,
        user: null,
      }));
    } catch (error) {
      console.error("Logout failed:", error);
      setState((prevState) => ({
        ...prevState,
        tokens: null,
        user: null,
      }));
    }
  };

  const clearError = (): void => {
    setState((prevState) => ({
      ...prevState,
      error: null,
    }));
  };

  const contextValue: AuthContextType = {
    ...state,
    isAuthenticated,
    initialize,
    register,
    submitEmailMfa,
    submitRegistrationStep2,
    refreshTokens,
    recoverAccount,
    registerPasskey,
    resendEmailMfa,
    login,
    logout,
    clearError,
    refreshUserData,
    generatePasskeyLinkChallenge,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthStore() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

export default function useAwaitedAuthStore() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const auth = useAuthStore();

  useEffect(() => {
    if (auth.isInitialized) setIsLoaded(true);
  }, [auth.isInitialized]);

  return { isLoaded, auth };
}
