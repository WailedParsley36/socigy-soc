import { off } from "process";
import { apiFetch } from "../apiClient";
import { AsyncResult } from "../structures/AsyncResult";
import { Device } from "../structures/auth/Device";
import { LoginAttempt } from "../structures/auth/LoginAttempt";
import { ErrorResponse } from "../structures/ErrorResponse";

interface AuthHelper {
  listMyDevices: (
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<Device[]>>;
  editMyDevice: (
    id: number,
    name?: string,
    isTrusted?: boolean,
    isBlocked?: boolean
  ) => Promise<ErrorResponse | void>;
  removeMyDevice: (id: number) => Promise<ErrorResponse | void>;

  listLogins: (
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<LoginAttempt[]>>;
  listDeviceLogins: (
    deviceId: number,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<LoginAttempt[]>>;
}

// TODO: Edit devices - 500 next sequence LINQ
// TODO: Remove devices - CORS

export const AuthAPI: AuthHelper = {
  async listMyDevices(limit: number = 10, offset: number = 0) {
    const response = await apiFetch(
      `/v1/auth/devices?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },

  async editMyDevice(
    id: number,
    name?: string,
    isTrusted?: boolean,
    isBlocked?: boolean
  ) {
    const response = await apiFetch(`/v1/auth/devices/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        name: name ?? undefined,
        isTrusted: isTrusted ?? undefined,
        isBlocked: isBlocked ?? undefined,
      }),
    });
    if (response.status != 200) return await response.json();
  },
  async removeMyDevice(id: number) {
    const response = await apiFetch(`/v1/auth/devices/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
      credentials: "include",
    });
    if (response.status != 200) return await response.json();
  },

  async listLogins(limit: number = 15, offset: number = 0) {
    const response = await apiFetch(
      `/v1/auth/security/logins?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },
  async listDeviceLogins(
    deviceId: number,
    limit: number = 15,
    offset: number = 0
  ) {
    const response = await apiFetch(
      `/v1/auth/security/logins/${deviceId}?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },
};
