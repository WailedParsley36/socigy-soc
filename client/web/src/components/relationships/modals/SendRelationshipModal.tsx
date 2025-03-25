import { useState } from "react";
import {
  RelationshipType,
  RelationshipDetailsRequest,
} from "@/lib/api/RelationshipHelper";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { UserAPI, UserQueryResponse } from "@/lib/api/UserHelper";

interface SendRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (request: RelationshipDetailsRequest) => void;
}

export default function SendRelationshipModal({
  isOpen,
  onClose,
  onSend,
}: SendRelationshipModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserQueryResponse[]>([]);
  const [selectedType, setSelectedType] = useState<RelationshipType>(
    RelationshipType.Following
  );
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserQueryResponse | null>(
    null
  );

  const handleSearch = async (value?: string) => {
    value ??= searchQuery;
    if (!value.trim()) return;

    setIsSearching(true);
    try {
      const response = await UserAPI.queryUsers(value);
      if (response.result) {
        setSearchResults(response.result);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = () => {
    if (!selectedUser) return;

    onSend({
      targetUser: selectedUser.id,
      type: selectedType,
    });

    resetForm();
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedType(RelationshipType.Following);
    setSelectedUser(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Connect with User</h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {!selectedUser ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search for a user
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
                  placeholder="Enter username or email"
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
              <div className="max-h-60 overflow-y-auto mb-4">
                {searchResults.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map((user) => (
                      <li
                        key={user.id}
                        className="py-2 cursor-pointer hover:bg-gray-50 flex items-center p-2 rounded"
                        onClick={() => setSelectedUser(user)}
                      >
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
                      </li>
                    ))}
                  </ul>
                ) : searchQuery && !isSearching ? (
                  <p className="text-gray-500 text-center py-4">
                    No users found
                  </p>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div className="mb-4">
            <div className="flex items-center mb-4">
              {selectedUser.iconUrl ? (
                <img
                  src={selectedUser.iconUrl}
                  alt={selectedUser.username}
                  className="h-12 w-12 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {selectedUser.username}
                  <span className="text-gray-500 text-sm ml-1">
                    #{selectedUser.tag}
                  </span>
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship Type
            </label>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(Number(e.target.value) as RelationshipType)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            >
              <option value={RelationshipType.Following}>Follow</option>
              <option value={RelationshipType.Friend}>Friend</option>
              <option value={RelationshipType.Subscription}>
                Subscription
              </option>
            </select>

            <p className="text-sm text-gray-600 mb-4">
              {selectedType === RelationshipType.Following
                ? "You will see their public posts in your feed."
                : selectedType === RelationshipType.Friend
                ? "Send a friend request. They will need to accept it."
                : "Subscribe to their content (may require payment)."}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {selectedUser ? (
            <button
              type="button"
              onClick={handleSendRequest}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Send Request
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              className="px-4 py-2 bg-indigo-300 text-white rounded-lg cursor-not-allowed"
            >
              Send Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
