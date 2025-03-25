// components/relationships/RelationshipCard.tsx
import { useState } from "react";
import {
  UserJoinedRelationship,
  RelationshipStatus,
  RelationshipType,
} from "@/lib/api/RelationshipHelper";
import {
  UserIcon,
  CheckIcon,
  XMarkIcon,
  NoSymbolIcon,
  TrashIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { Guid } from "@/lib/structures/Guid";
import RelationshipActions from "./RelationshipActions";

interface RelationshipCardProps {
  relationship: UserJoinedRelationship;
  onRemove: (targetUserId: Guid) => void;
  onAccept: (targetUserId: Guid) => void;
  onReject: (targetUserId: Guid) => void;
  onBlock: (targetUserId: Guid) => void;
  onUnblock: (targetUserId: Guid) => void;
}

export default function RelationshipCard({
  relationship,
  onRemove,
  onAccept,
  onReject,
  onBlock,
  onUnblock,
}: RelationshipCardProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);

  const getStatusBadge = () => {
    switch (relationship.computedStatus) {
      case RelationshipStatus.Pending:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case RelationshipStatus.Received:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Received
          </span>
        );
      case RelationshipStatus.Accepted:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connected
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
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {relationship.targetIconUrl ? (
            <img
              src={relationship.targetIconUrl}
              alt={relationship.targetUsername}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {relationship.targetUsername}
              <span className="text-gray-500 text-sm ml-1">
                #{relationship.targetTag}
              </span>
            </h3>
            <div className="flex items-center mt-1">
              {getStatusBadge()}
              <span className="ml-2 text-sm text-gray-500">
                {RelationshipType[relationship.type]}
              </span>
            </div>
          </div>
        </div>

        {isConfirmingBlock && (
          <div className="flex gap-1">
            <button
              onClick={() => setIsConfirmingBlock(false)}
              className="p-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onBlock(relationship.targetId);
                setIsConfirmingBlock(false);
              }}
              className="p-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Block
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 text-sm text-gray-600">
        {relationship.requestedAt && (
          <p>
            Requested: {new Date(relationship.requestedAt).toLocaleDateString()}
          </p>
        )}
        {relationship.acceptedAt && (
          <p>
            Connected: {new Date(relationship.acceptedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {relationship.status == RelationshipStatus.Pending ||
      relationship.status == RelationshipStatus.Received ? (
        <div className="flex justify-between mt-4">
          {relationship.status == RelationshipStatus.Received && (
            <button
              onClick={() => onAccept(relationship.targetId)}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
            >
              <CheckIcon className="h-4 w-4" />
              Accept
            </button>
          )}
          <button
            onClick={() =>
              relationship.status == RelationshipStatus.Pending
                ? onRemove(relationship.targetId)
                : onReject(relationship.targetId)
            }
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <XMarkIcon className="h-4 w-4" />
            {relationship.computedStatus == RelationshipStatus.Pending
              ? "Unsend"
              : relationship.computedStatus == RelationshipStatus.Rejected
              ? "Forget"
              : "Reject"}
          </button>
        </div>
      ) : (
        <RelationshipActions
          relationshipType={relationship.type}
          relationshipStatus={
            relationship.status > relationship.targetStatus
              ? relationship.status
              : relationship.targetStatus
          }
          onRemove={() => onRemove(relationship.targetId)}
          onBlock={() => onBlock(relationship.targetId)}
          onUnblock={() => onUnblock(relationship.targetId)}
        />
      )}
    </div>
  );
}
