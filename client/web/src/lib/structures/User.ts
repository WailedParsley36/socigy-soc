import { Guid } from "./Guid";

export interface User {
  id: Guid;
  username?: string;
  tag?: number;
  displayName?: string

  iconUrl?: string;

  email?: string;
  emailVerified?: boolean;
  registrationComplete?: boolean;

  phoneNumber?: string;
  sex?: number;

  firstName?: string;
  lastName?: string;

  birthDate?: Date;

  isChild?: boolean;
  parentId?: Guid;

  visibility?: number;
}
