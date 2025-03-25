import { Guid } from "../Guid";

export default interface Category {
  id: Guid;

  name: string;
  emoji: string;

  description: string;

  minAge: number;
}

export interface CategoryPreference {
  contentId: Guid;
  weight: number; // 0 - 1000
}
