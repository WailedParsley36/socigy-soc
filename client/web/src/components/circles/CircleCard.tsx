import { useState } from "react";
import {
  UserCircle,
  CircleType,
  EditCircleDetailsRequest,
  RelationshipAPI,
} from "@/lib/api/RelationshipHelper";
import {
  UserIcon,
  UsersIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Guid } from "@/lib/structures/Guid";
import EditCircleModal from "./modals/EditCircleModal";
import { de } from "date-fns/locale";

interface CircleCardProps {
  circle: UserCircle;
  onDelete: (id: Guid) => void;
}

export default function CircleCard({ circle, onDelete }: CircleCardProps) {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const getCircleIcon = () => {
    switch (circle.type) {
      case CircleType.Friends:
        return <UsersIcon className="h-8 w-8 text-blue-500" />;
      case CircleType.Followers:
        return <UserIcon className="h-8 w-8 text-green-500" />;
      case CircleType.Following:
        return <UserIcon className="h-8 w-8 text-purple-500" />;
      case CircleType.Subscribers:
        return <UserIcon className="h-8 w-8 text-yellow-500" />;
      case CircleType.Subscriptions:
        return <UserIcon className="h-8 w-8 text-orange-500" />;
      case CircleType.SharedGroup:
        return <UsersIcon className="h-8 w-8 text-red-500" />;
      default:
        return <UsersIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleCircleEdit = async (details: EditCircleDetailsRequest) => {
    const response = await RelationshipAPI.editCircle(circle.id, details);
    if (response.error) throw new Error(response.error.message);

    setShowEdit(false);
    if (details.name) circle.name = details.name;
    if (details.isDefault) circle.isDefault = details.isDefault;
  };

  const getCircleTypeName = () => {
    return CircleType[circle.type];
  };

  const handleViewDetails = () => {
    router.push(`/circles/${circle.id}`);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(circle.id);
  };

  return (
    <div
      onClick={handleViewDetails}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-100"
    >
      {showEdit && (
        <EditCircleModal
          circle={circle}
          onClose={() => setShowEdit(false)}
          onEdit={handleCircleEdit}
        />
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {getCircleIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {circle.name}
            </h3>
            <p className="text-sm text-gray-500">{getCircleTypeName()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEdit(true);
            }}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {!circle.isDefault && (
            <>
              {!isConfirmingDelete ? (
                <button
                  onClick={confirmDelete}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  disabled={circle.isDefault}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={cancelDelete}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {circle.isDefault && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Default
        </span>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Created:{" "}
        {circle.createdAt
          ? new Date(circle.createdAt).toLocaleDateString()
          : "N/A"}
      </div>
    </div>
  );
}
