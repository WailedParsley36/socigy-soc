import { MFAType } from "@/stores/AuthStore";

export const MfaHelper = {
  getRouteToMfa(type: MFAType) {
    switch (type) {
      case MFAType.Email:
        return "(auth)/(mfa)/email";

      case MFAType.Authenticator:
        return "(auth)/(mfa)/totp";
    }

    return "(auth)/(mfa)/email";
  },
};
