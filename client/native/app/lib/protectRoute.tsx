import { AuthState } from "@/stores/AuthStore";
import { Redirect, Router } from "expo-router";

interface ProtectedRouteOptions {
  allowNonRegistered: boolean;
  allowNonVerified: boolean;
  onlyNonRegistered?: boolean;
  redirectOverride?: string;
}

export default function protectRoute(
  auth: AuthState,
  options?: ProtectedRouteOptions
): any | undefined {
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
    return <Redirect href={"/(auth)/login"} />;
  }

  return undefined;
}
