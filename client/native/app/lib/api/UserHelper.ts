import { AsyncResult } from "../structures/AsyncResult";
import { apiFetch } from "../apiClient";
import { Guid } from "../structures/Guid";
import {
  RelationshipStatus,
  RelationshipType,
  UserQueryInfo,
  UserVisibility,
} from "./RelationshipHelper";

// Interface definitions matching the C# classes
export interface UserQueryRelationship {
  type: RelationshipType;
  status: RelationshipStatus;
}

export interface UserQueryResponse {
  id: Guid;
  username: string;
  tag: number;
  iconUrl: string | null;
  visibility: UserVisibility;
  relationships: UserQueryRelationship[] | null;
  relationshipsRaw: string;
  computedType: RelationshipType;
  computedStatus: RelationshipStatus;
}

const encodeParameter = (param: string): string => {
  return btoa(param);
};

export const UserAPI = {
  async queryUsers(
    query: string,
    relationshipType?: RelationshipType,
    isIncoming: boolean = true,
    me: boolean = false,
    limit: number = 15,
    offset: number = 0
  ): Promise<AsyncResult<UserQueryResponse[]>> {
    const encodedQuery = encodeParameter(query);
    let url = `/v1/user/query?query=${encodedQuery}&limit=${limit}&offset=${offset}`;

    if (relationshipType !== undefined) {
      const encodedRelationshipType = encodeParameter(
        RelationshipType[relationshipType]
      );
      url += `&relationshipType=${encodedRelationshipType}`;
    }
    if (me) {
      url += `&me=${me}`;
    }

    const response = await apiFetch(url);

    if (response.status !== 200) {
      return { error: await response.json() };
    }

    return { result: await response.json() };
  },
};
