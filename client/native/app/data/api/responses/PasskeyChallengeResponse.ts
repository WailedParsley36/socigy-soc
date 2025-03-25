import { Guid, PasskeyRpInfo, PasskeyUserInfo } from "expo-passkeys/build/ExpoPasskeys.types";
import { ErrorResponse } from "./ErrorResponse";
import { AsyncResult } from "./AsyncResponse";

export type PasskeyChallengeInfo = {
    challenge?: string,
    user?: PasskeyUserInfo,
    relayingParty?: PasskeyRpInfo

    mfaRequired: boolean
}