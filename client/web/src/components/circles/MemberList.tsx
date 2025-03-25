// components/circles/MembersList.tsx
import { useState } from "react";
import {
  UserCircleMember,
  CircleMemberRole,
  CircleMemberBatchDetails,
  CircleType,
} from "@/lib/api/RelationshipHelper";
import { UserIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Guid } from "@/lib/structures/Guid";

interface MembersListProps {
  members: UserCircleMember[];
  onRemove: (userId: Guid) => void;
  onEdit: (member: CircleMemberBatchDetails) => void;
  circleType: CircleType;
}

export default function MembersList({
  members,
  onRemove,
  onEdit,
  circleType,
}: MembersListProps) {
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [role, setRole] = useState<CircleMemberRole>(CircleMemberRole.Member);

  const handleEditClick = (member: UserCircleMember) => {
    setEditingMember(member.userId);
    setNickname(member.nickname || "");
    setRole(member.role);
  };

  const handleSaveEdit = (userId: Guid) => {
    onEdit({
      id: userId,
      nickname: nickname || undefined,
      role: circleType === CircleType.SharedGroup ? role : undefined,
    });
    setEditingMember(null);
  };

  const cancelEdit = () => {
    setEditingMember(null);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No members in this circle.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md">
      <ul className="divide-y divide-gray-200">
        {members.map((member) => (
          <li key={member.userId} className="p-4">
            {editingMember === member.userId ? (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  {member.iconUrl ? (
                    <img
                      src={member.iconUrl}
                      alt={member.username || "User"}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {member.username}
                      {member.tag && (
                        <span className="text-gray-500 text-sm ml-1">
                          #{member.tag}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nickname"
                    />
                  </div>
                  {circleType === CircleType.SharedGroup && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) =>
                          setRole(Number(e.target.value) as CircleMemberRole)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={CircleMemberRole.Member}>Member</option>
                        <option value={CircleMemberRole.Admin}>Admin</option>
                        <option value={CircleMemberRole.Owner}>Owner</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(member.userId)}
                    className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {member.iconUrl ? (
                    <img
                      src={member.iconUrl}
                      alt={member.username || "User"}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {member.username}
                      {member.tag && (
                        <span className="text-gray-500 text-sm ml-1">
                          #{member.tag}
                        </span>
                      )}
                    </p>
                    {member.nickname && (
                      <p className="text-sm text-gray-500">
                        Nickname: {member.nickname}
                      </p>
                    )}
                    {circleType === CircleType.SharedGroup && (
                      <p className="text-sm text-gray-500">
                        Role: {CircleMemberRole[member.role]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(member)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onRemove(member.userId)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
