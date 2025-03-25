import { RelationshipType } from "@/lib/api/RelationshipHelper";
import {
  UserIcon,
  UsersIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface RelationshipTypeSelectorProps {
  selectedType: RelationshipType;
  onSelectType: (type: RelationshipType) => void;
}

export default function RelationshipTypeSelector({
  selectedType,
  onSelectType,
}: RelationshipTypeSelectorProps) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        className={`flex items-center gap-2 py-3 px-4 ${
          selectedType === RelationshipType.Following
            ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onSelectType(RelationshipType.Following)}
      >
        <UserIcon className="h-5 w-5" />
        Following
      </button>
      <button
        className={`flex items-center gap-2 py-3 px-4 ${
          selectedType === RelationshipType.Follower
            ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onSelectType(RelationshipType.Follower)}
      >
        <UserIcon className="h-5 w-5" />
        Followers
      </button>
      <button
        className={`flex items-center gap-2 py-3 px-4 ${
          selectedType === RelationshipType.Friend
            ? "border-b-2 border-green-600 text-green-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onSelectType(RelationshipType.Friend)}
      >
        <UsersIcon className="h-5 w-5" />
        Friends
      </button>
      <button
        className={`flex items-center gap-2 py-3 px-4 ${
          selectedType === RelationshipType.Subscription
            ? "border-b-2 border-yellow-600 text-yellow-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onSelectType(RelationshipType.Subscription)}
      >
        <StarIcon className="h-5 w-5" />
        Subscriptions
      </button>
      <button
        className={`flex items-center gap-2 py-3 px-4 ${
          selectedType === RelationshipType.Subscriber
            ? "border-b-2 border-yellow-600 text-yellow-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onSelectType(RelationshipType.Subscriber)}
      >
        <StarIcon className="h-5 w-5" />
        Subscribers
      </button>
      <button
        className={`flex items-center gap-2 py-3 px-4 ${
          selectedType === RelationshipType.Blocked
            ? "border-b-2 border-red-600 text-red-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => onSelectType(RelationshipType.Blocked)}
      >
        <XMarkIcon className="h-5 w-5" />
        Blocked
      </button>
    </div>
  );
}
