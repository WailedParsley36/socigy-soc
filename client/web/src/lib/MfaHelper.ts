import { MFAType } from "@/stores/AuthStore";

export const MfaHelper = {
  getRouteToMfa(type: MFAType) {
    switch (type) {
      case MFAType.Email:
        return "/mfa/email";

      case MFAType.Authenticator:
        return "/mfa/totp";
    }

    return "/mfa/email";
  },
};
