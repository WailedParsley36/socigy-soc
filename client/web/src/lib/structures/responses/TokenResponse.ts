import { Guid } from "../Guid";

export interface TokenResponse {
  userId: Guid;
  accessExpiry: number;
  refreshExpiry: number;

  challenge: string | null;
  isRecovery: boolean;
}
