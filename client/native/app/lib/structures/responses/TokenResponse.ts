import { Guid } from "../Guid";

export interface TokenResponse {
  userId: Guid;
  accessToken: string;
  accessExpiry: number;
  refreshToken: string;
  refreshExpiry: number;

  challenge: string | null;
  isRecovery: boolean;
}
