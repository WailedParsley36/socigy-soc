"use client";

import { AuthState } from "@/stores/AuthStore";

interface ProtectedRouteOptions {
  allowNonRegistered: boolean;
  allowNonVerified: boolean;
  onlyNonRegistered?: boolean;
  redirectOverride?: string;
}

export default function protectRoute(
  auth: AuthState,
  options?: ProtectedRouteOptions
): string | undefined {
  options ??= {
    allowNonRegistered: false,
    allowNonVerified: false,
  };

  if (
    auth.user &&
    auth.user.registrationComplete &&
    options.onlyNonRegistered
  ) {
    return "/";
  }

  if (
    !auth.user ||
    (!options.allowNonRegistered && auth.user.registrationComplete == false) ||
    (!options.allowNonVerified && auth.user.emailVerified == false)
  ) {
    return (
      (options.redirectOverride ?? "https://socigy.com/login?") +
      `redirectUrl=${globalThis?.window?.location.pathname ?? "/"}`
    );
  }

  return undefined;
}
