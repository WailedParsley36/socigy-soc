// ProfileHelper.ts
import { AsyncResult } from "@/lib/structures/AsyncResult";
import { apiFetch } from "@/lib/apiClient";
import { Guid } from "@/lib/structures/Guid";

export interface Device {
  id: number;
  deviceName: string;
  deviceType: number;
  isNew: boolean;
  isBlocked: boolean;
  isTrusted: boolean;
  isCurrent: boolean;
  lastUsedAt: string | null;
  createdAt: string | null;
}

export enum SecurityEventType {
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  PASSWORD_CHANGE,
  EMAIL_CHANGE,
  MFA_ENABLED,
  MFA_DISABLED,
  DEVICE_TRUSTED,
  DEVICE_BLOCKED,
  MFA_REMOVED
}

export enum DeviceType {
  Unknown = 1,
  App = 2,
  Browser = 4,
  Android = 8,
  Windows = 16,
  TvOS = 32,
  IOS = 64,
  MacOSx = 128,
  Mobile = 256,
  Chrome = 512,
  Brave = 1024,
  Linux = 2048,
  iPad = 4096,
  Edge = 8192,
  Safari = 16384,
  Desktop,
  Tablet,
  Other,
}
export enum MFAType {
  Email,
  PhoneNumber,
  Authenticator,
  Application,
}

export interface LoginAttempt {
  success: boolean;
  ipAddress: string;
  userAgent: string;
  deviceId: number | null;
  attemptAt: string | null;
}

export interface SecurityLog {
  id: number;
  eventType: number;
  details: string;
  eventAt: string;
  ipAddress: string;
  arguments: string;
}

export interface MFASettings {
  type: number;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserProfile {
  id: Guid;
  username: string;
  tag: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  socialLinks: { [key: string]: string };
  interests: string[];
}

export const ProfileHelper = {
  async getUserProfile(): Promise<AsyncResult<UserProfile>> {
    const response = await apiFetch("/v1/user/me");
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async updateUserProfile(
    profile: Partial<UserProfile>
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async listDevices(
    limit: number = 10,
    offset: number = 0
  ): Promise<AsyncResult<Device[]>> {
    const response = await apiFetch(
      `/v1/auth/devices?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async editDevice(
    deviceId: number,
    name?: string,
    isTrusted?: boolean,
    isBlocked?: boolean
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch(`/v1/auth/devices/${deviceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, isTrusted, isBlocked }),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async removeDevice(deviceId: number): Promise<AsyncResult<void>> {
    const response = await apiFetch(`/v1/auth/devices/${deviceId}`, {
      method: "DELETE",
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async listLoginAttempts(
    limit: number = 10,
    offset: number = 0
  ): Promise<AsyncResult<LoginAttempt[]>> {
    const response = await apiFetch(
      `/v1/auth/security/logins?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async listSecurityEvents(
    limit: number = 10,
    offset: number = 0
  ): Promise<AsyncResult<SecurityLog[]>> {
    const response = await apiFetch(
      `/v1/auth/security/events?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async listMFASettings(
    limit: number = 10,
    offset: number = 0
  ): Promise<AsyncResult<MFASettings[]>> {
    const response = await apiFetch(
      `/v1/auth/security/mfa?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async enableMFA(type: number): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/auth/security/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async editMFA(type: number, isDefault: boolean): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/auth/security/mfa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, isDefault }),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async removeMFA(type: number): Promise<AsyncResult<void>> {
    const response = await apiFetch(`/v1/auth/security/mfa?mfaType=${type}`, {
      method: "DELETE",
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },
};
