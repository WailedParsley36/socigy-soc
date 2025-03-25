import { AsyncResult } from "../structures/AsyncResult";
import { apiFetch } from "../apiClient";
import { Guid } from "../structures/Guid";

// Enums
export enum CircleType {
  Friends,
  Followers,
  Subscribers,
  Subscriptions,
  Following,
  Blocked,
  Mixed,
  SharedGroup,
}

export enum CircleMemberRole {
  Member = 0,
  Admin = 1,
  Owner = 2,
}

export enum RelationshipType {
  Blocked,
  Following,
  Follower,
  Friend,
  Subscriber,
  Subscription,
}

export enum RelationshipStatus {
  Pending,
  Accepted,
  Rejected,
  Blocked,
  Received,

  Remove,
}

export enum ContactType {
  Email = 0,
  Phone = 1,
  Other = 2,
}

export enum UserVisibility {
  Public,
  CirclesOnly,
  CustomCircles,
}

// Interfaces
export interface UserCircle {
  id: Guid;
  ownerId: Guid;
  name: string;
  type: CircleType;
  isDefault: boolean;
  createdAt?: Date;
}

export interface UserCircleMember {
  circleId: Guid;
  userId: Guid;
  username?: string;
  tag?: number;
  iconUrl?: string;
  nickname?: string;
  nameOverride?: string;
  role: CircleMemberRole;
  addedAt: Date;
}

export interface UserCircleInvitation {
  invitation_id: Guid;
  circleId: Guid;
  inviteeId: Guid;
  inviterId: Guid;
  inviteeUsername?: string;
  inviteeTag?: number;
  inviteeIconUrl?: string;
  nickname?: string;
  nameOverride?: string;
  status: RelationshipStatus;
  invitedAt: Date;
  responseAt?: Date;
}

export interface CircleDetailsResponse {
  info?: UserCircle;
  members?: UserCircleMember[];
  invitations?: UserCircleInvitation[];
}

export interface CircleMemberBatchDetails {
  id: Guid;
  nickname?: string;
  role?: CircleMemberRole;
}

export interface EditCircleDetailsRequest {
  name?: string;
  isDefault?: boolean;
  type?: CircleType;
}

export interface UserRelationship {
  userId: Guid;
  targetId: Guid;
  type: RelationshipType;
  status: RelationshipStatus;
  requestedAt?: Date;
  acceptedAt?: Date;
}

export interface UserJoinedRelationship {
  user_id: Guid;
  targetId: Guid;
  type: RelationshipType;
  requestedAt: Date;
  acceptedAt?: Date;
  computedStatus: RelationshipStatus;
  status: RelationshipStatus;
  targetStatus: RelationshipStatus;
  targetUsername: string;
  targetTag: number;
  targetIconUrl?: string;
}

export interface RelationshipDetailsRequest {
  targetUser: Guid;
  type?: RelationshipType;
  status?: RelationshipStatus;
}

export interface UserContact {
  id: Guid;
  ownerId: Guid;
  matchedUserId?: Guid;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
}

export interface UserContactDetail {
  id: Guid;
  contactId: Guid;
  type: ContactType;
  value: string;
}

export interface ContactResponse {
  id: Guid;
  matchedUser?: Guid;
  nickname: string;
  firstName: string;
  lastName: string;
  emails?: string[];
  phoneNumbers?: string[];
}

export interface UserImportContact {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  emails?: string[];
  phoneNumbers?: string[];
}

export interface UserQueryInfo {
  id: Guid;
  username: string;
  tag: number;
  iconUrl?: string;
  visibility: UserVisibility;
}

const encodeParameter = (param: string): string => {
  return btoa(param);
};

// RelationshipAPI
export const RelationshipAPI = {
  // Circle methods
  async listCircles(
    limit: number = 10,
    offset: number = 0
  ): Promise<AsyncResult<UserCircle[]>> {
    const response = await apiFetch(
      `/v1/user/circles?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async createCircle(
    details: EditCircleDetailsRequest
  ): Promise<AsyncResult<UserCircle>> {
    const response = await apiFetch("/v1/user/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getCircleDetails(
    circleId: Guid
  ): Promise<AsyncResult<CircleDetailsResponse>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(`/v1/user/circles/${encodedCircleId}`);
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getCircleMembers(
    circleId: Guid
  ): Promise<AsyncResult<CircleDetailsResponse>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(
      `/v1/user/circles/${encodedCircleId}/members`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getCircleMemberInvitations(
    circleId: Guid
  ): Promise<AsyncResult<CircleDetailsResponse>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(
      `/v1/user/circles/${encodedCircleId}/invitations`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async editCircle(
    circleId: Guid,
    details: EditCircleDetailsRequest
  ): Promise<AsyncResult<void>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(`/v1/user/circles/${encodedCircleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async deleteCircle(circleId: Guid): Promise<AsyncResult<void>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(`/v1/user/circles/${encodedCircleId}`, {
      method: "DELETE",
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async addCircleMembers(
    circleId: Guid,
    members: CircleMemberBatchDetails[]
  ): Promise<AsyncResult<void>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(`/v1/user/circles/${encodedCircleId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(members),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async removeCircleMembers(
    circleId: Guid,
    members: CircleMemberBatchDetails[]
  ): Promise<AsyncResult<void>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(
      `/v1/user/circles/${encodedCircleId}/remove`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(members),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async editCircleMembers(
    circleId: Guid,
    members: CircleMemberBatchDetails[]
  ): Promise<AsyncResult<void>> {
    const encodedCircleId = encodeParameter(circleId);
    const response = await apiFetch(
      `/v1/user/circles/${encodedCircleId}/edit`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(members),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Relationship methods
  async listRelationships(
    type: RelationshipType,
    limit: number = 10,
    offset: number = 0
  ): Promise<AsyncResult<UserJoinedRelationship[]>> {
    const encodedType = encodeParameter(RelationshipType[type].toString());
    const response = await apiFetch(
      `/v1/user/relationships?type=${encodedType}&limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async sendRelationship(
    request: RelationshipDetailsRequest
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/user/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async unsendRelationship(
    request: RelationshipDetailsRequest
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/user/relationships", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async blockUser(targetUserId: Guid): Promise<AsyncResult<void>> {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
    };
    const response = await apiFetch("/v1/user/relationships/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },
  async unblockUser(targetUserId: Guid): Promise<AsyncResult<void>> {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
    };
    const response = await apiFetch("/v1/user/relationships/unblock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async setRelationshipStatus(
    request: RelationshipDetailsRequest
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/user/relationships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async getRelationshipDetails(
    targetUserId: Guid,
    type: RelationshipType
  ): Promise<AsyncResult<UserJoinedRelationship>> {
    const encodedTargetUserId = encodeParameter(targetUserId);
    const encodedType = encodeParameter(RelationshipType[type].toString());
    const response = await apiFetch(
      `/v1/user/relationships/${encodedTargetUserId}?type=${encodedType}`,
      {
        method: "POST",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  // Contact methods
  async listContacts(
    matching?: boolean,
    limit: number = 10,
    offset: number = 0
  ): Promise<AsyncResult<ContactResponse[]>> {
    let url = `/v1/user/contacts?limit=${limit}&offset=${offset}`;
    if (matching !== undefined) {
      url += `&matching=${matching}`;
    }
    const response = await apiFetch(url);
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async addContacts(contacts: UserImportContact[]): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/user/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contacts),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async removeContacts(contactIds: Guid[]): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/user/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactIds),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async editContact(
    contactId: Guid,
    contact: UserImportContact
  ): Promise<AsyncResult<void>> {
    const encodedContactId = encodeParameter(contactId);
    const response = await apiFetch(`/v1/user/contacts/${encodedContactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },
};
