import { useState } from "react";
import {
  RelationshipType,
  RelationshipStatus,
} from "@/lib/api/RelationshipHelper";
import {
  UserMinusIcon,
  NoSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface RelationshipActionsProps {
  relationshipType: RelationshipType;
  relationshipStatus: RelationshipStatus;
  onRemove: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}

export default function RelationshipActions({
  relationshipType,
  relationshipStatus,
  onRemove,
  onBlock,
  onUnblock,
}: RelationshipActionsProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);

  const getActionText = () => {
    switch (relationshipType) {
      case RelationshipType.Blocked:
        return "Unblock";
      case RelationshipType.Following:
        return "Unfollow";
      case RelationshipType.Follower:
        return "Remove Follower";
      case RelationshipType.Friend:
        return relationshipStatus == RelationshipStatus.Rejected
          ? "Forget"
          : "Unfriend";
      case RelationshipType.Subscriber:
        return "Remove Subscriber";
      case RelationshipType.Subscription:
        return "Unsubscribe";
      default:
        return "Remove";
    }
  };

  return (
    <div className="flex justify-between mt-4">
      {relationshipType != RelationshipType.Blocked && (
        <>
          {!isConfirmingBlock ? (
            <button
              onClick={() => setIsConfirmingBlock(true)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
            >
              <NoSymbolIcon className="h-4 w-4" />
              Block
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmingBlock(false)}
                className="text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onBlock();
                  setIsConfirmingBlock(false);
                }}
                className="text-sm text-red-600 font-medium"
              >
                Confirm Block
              </button>
            </div>
          )}
        </>
      )}
      {/* Remove/Unfollow/Unfriend Button */}
      {!isConfirmingRemove ? (
        <button
          onClick={() => setIsConfirmingRemove(true)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
        >
          {relationshipType === RelationshipType.Blocked ? (
            <>
              <NoSymbolIcon className="h-4 w-4" />
              {getActionText()}
            </>
          ) : (
            <>
              {relationshipStatus === RelationshipStatus.Rejected ? (
                <XMarkIcon className="h-4 w-4" />
              ) : (
                <UserMinusIcon className="h-4 w-4" />
              )}
              {getActionText()}
            </>
          )}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setIsConfirmingRemove(false)}
            className="text-sm text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (relationshipType === RelationshipType.Blocked) onUnblock();
              else onRemove();
              setIsConfirmingRemove(false);
            }}
            className="text-sm text-red-600 font-medium"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
