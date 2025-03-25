

import { AuthState } from "@/stores/AuthStore";

interface UnProtectedRouteOptions {
  allowNonRegistered: boolean;
  allowNonVerified: boolean;
  redirectOverride?: string;
}

export default function unprotectRoute(
  auth: AuthState,
  options: UnProtectedRouteOptions
): boolean {
  options ??= {
    allowNonRegistered: false,
    allowNonVerified: false,
  };

  console.log("Auth:", auth);

  if (
    auth.user &&
    !options.allowNonRegistered &&
    auth.user.registrationComplete == false &&
    !options.allowNonVerified &&
    auth.user.emailVerified == false
  ) {
    return true;
  }

  return false;
}
