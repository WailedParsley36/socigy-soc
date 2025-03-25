"use client";

import { BASE_API_URL } from "@/constants";
import { DeviceId } from "./DeviceRecognizer";

export function includeRequiredHeaders(headers?: HeadersInit): HeadersInit {
  if (!DeviceId) return { ...headers };

  return {
    ...headers,
    "X-Device-Id": DeviceId.visitorId!,
  };
}

export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  init ??= {};
  init.credentials = "include";
  init.headers = includeRequiredHeaders(init.headers);

  const response = await fetch(`${BASE_API_URL}${url}`, init);
  if (response.status == 401) {
    // TODO: Refresh tokens
  }

  return response;
}
