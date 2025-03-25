// components/circles/AddMembersModal.tsx
import { useState, useEffect } from "react";
import {
  CircleMemberBatchDetails,
  CircleType,
  UserQueryInfo,
  CircleMemberRole,
  RelationshipType,
  RelationshipStatus,
  UserVisibility,
} from "@/lib/api/RelationshipHelper";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { UserAPI, UserQueryResponse } from "@/lib/api/UserHelper";

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (members: CircleMemberBatchDetails[]) => void;
  circleType: CircleType;
}

function getRelationshipTypeFromCircleType(
  type: CircleType
): RelationshipType | undefined {
  switch (type) {
    case CircleType.Following:
      return RelationshipType.Following;
    case CircleType.Followers:
      return RelationshipType.Follower;
    case CircleType.Friends:
      return RelationshipType.Friend;
    case CircleType.Subscribers:
      return RelationshipType.Subscriber;
    case CircleType.Subscriptions:
      return RelationshipType.Subscription;
  }
}

export default function AddMembersModal({
  isOpen,
  onClose,
  onAdd,
  circleType,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserQueryResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<
    Map<string, CircleMemberBatchDetails>
  >(new Map());
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUsers(new Map());
    }
  }, [isOpen]);

  const handleSearch = async (value?: string) => {
    value ??= searchQuery;
    if (!value.trim()) return;

    setIsSearching(true);
    try {
      console.log("CIRCLE TYPE", circleType);
      const relType = getRelationshipTypeFromCircleType(circleType);
      const response = await UserAPI.queryUsers(value, relType);
      if (response.result) {
        const filteredResults = response.result.filter(
          (user) => !selectedUsers.has(user.id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: UserQueryResponse) => {
    const updatedUsers = new Map(selectedUsers);
    updatedUsers.set(user.id, {
      id: user.id,
      nickname: "",
      role: CircleMemberRole.Member,
    });
    setSelectedUsers(updatedUsers);

    // Remove from search results
    setSearchResults(searchResults.filter((result) => result.id !== user.id));
  };

  const handleRemoveUser = (userId: string) => {
    const updatedUsers = new Map(selectedUsers);
    updatedUsers.delete(userId);
    setSelectedUsers(updatedUsers);
  };

  const handleChangeNickname = (userId: string, nickname: string) => {
    const updatedUsers = new Map(selectedUsers);
    const user = updatedUsers.get(userId);
    if (user) {
      updatedUsers.set(userId, { ...user, nickname });
      setSelectedUsers(updatedUsers);
    }
  };

  const handleChangeRole = (userId: string, role: CircleMemberRole) => {
    const updatedUsers = new Map(selectedUsers);
    const user = updatedUsers.get(userId);
    if (user) {
      updatedUsers.set(userId, { ...user, role });
      setSelectedUsers(updatedUsers);
    }
  };

  const handleSubmit = () => {
    onAdd(Array.from(selectedUsers.values()));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Add Members to Circle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search for users to add
          </label>
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by username or email"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={() => handleSearch()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isSearching ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
            {searchResults.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {searchResults.map((user) => (
                  <li
                    key={user.id}
                    className="p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      {user.iconUrl ? (
                        <img
                          src={user.iconUrl}
                          alt={user.username}
                          className="h-8 w-8 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.username}
                          <span className="text-gray-500 text-sm ml-1">
                            #{user.tag}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectUser(user)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchQuery ? (
              <p className="text-gray-500 text-center py-4">No users found</p>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Search for users to add
              </p>
            )}
          </div>
        )}

        {selectedUsers.size > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              Selected Users
            </h3>
            <ul className="space-y-3">
              {Array.from(selectedUsers.entries()).map(([userId, details]) => {
                const user = searchResults.find((u) => u.id === userId);
                return (
                  <li key={userId} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user?.username || userId}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(userId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nickname (optional)
                        </label>
                        <input
                          type="text"
                          value={details.nickname || ""}
                          onChange={(e) =>
                            handleChangeNickname(userId, e.target.value)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Nickname"
                        />
                      </div>

                      {circleType === CircleType.SharedGroup && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <select
                            value={details.role}
                            onChange={(e) =>
                              handleChangeRole(
                                userId,
                                Number(e.target.value) as CircleMemberRole
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value={CircleMemberRole.Member}>
                              Member
                            </option>
                            <option value={CircleMemberRole.Admin}>
                              Admin
                            </option>
                            <option value={CircleMemberRole.Owner}>
                              Owner
                            </option>
                          </select>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedUsers.size === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedUsers.size === 0
                ? "bg-indigo-300 text-white cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            Add Members
          </button>
        </div>
      </div>
    </div>
  );
}
