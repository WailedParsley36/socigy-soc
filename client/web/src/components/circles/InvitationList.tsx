// components/circles/InvitationsList.tsx
import { useState } from "react";
import {
  UserCircleInvitation,
  RelationshipStatus,
} from "@/lib/api/RelationshipHelper";
import { UserIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface InvitationsListProps {
  invitations: UserCircleInvitation[];
}

export default function InvitationsList({ invitations }: InvitationsListProps) {
  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pending invitations for this circle.</p>
      </div>
    );
  }

  const getStatusBadge = (status: RelationshipStatus) => {
    switch (status) {
      case RelationshipStatus.Pending:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case RelationshipStatus.Accepted:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Accepted
          </span>
        );
      case RelationshipStatus.Rejected:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Rejected
          </span>
        );
      case RelationshipStatus.Blocked:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Blocked
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md">
      <ul className="divide-y divide-gray-200">
        {invitations.map((invitation) => (
          <li key={invitation.invitation_id} className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {invitation.inviteeIconUrl ? (
                  <img
                    src={invitation.inviteeIconUrl}
                    alt={invitation.inviteeUsername || "User"}
                    className="h-10 w-10 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800">
                    {invitation.inviteeUsername}
                    {invitation.inviteeTag && (
                      <span className="text-gray-500 text-sm ml-1">
                        #{invitation.inviteeTag}
                      </span>
                    )}
                  </p>
                  {invitation.nickname && (
                    <p className="text-sm text-gray-500">
                      Nickname: {invitation.nickname}
                    </p>
                  )}
                  <div className="mt-1">
                    {getStatusBadge(invitation.status)}
                    <span className="text-xs text-gray-500 ml-2">
                      Invited:{" "}
                      {new Date(invitation.invitedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {invitation.status === RelationshipStatus.Pending && (
                <div className="flex space-x-2">
                  <button
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Resend invitation"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Cancel invitation"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
