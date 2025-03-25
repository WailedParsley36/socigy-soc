import { Guid } from "../Guid";

export default interface Interest {
  id: Guid;
  categoryId: Guid;

  name: string;
  emoji: string;

  description: string;

  minAge: number;
}

export interface InterestPreference {
  contentId: Guid;
  weight: number;
}
