"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RelationshipAPI,
  CircleDetailsResponse,
  CircleMemberBatchDetails,
  CircleMemberRole,
  CircleType,
} from "@/lib/api/RelationshipHelper";
import MembersList from "@/components/circles/MemberList";
import InvitationsList from "@/components/circles/InvitationList";
import AddMembersModal from "@/components/circles/modals/AddMembersModal";
import { ArrowLeftIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { Guid } from "@/lib/structures/Guid";

export default function CircleDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [circleDetails, setCircleDetails] =
    useState<CircleDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCircleDetails();
    }
  }, [id]);

  const loadCircleDetails = async () => {
    setIsLoading(true);
    const response = await RelationshipAPI.getCircleDetails(id as Guid);
    if (response.result) {
      setCircleDetails(response.result);
    }
    setIsLoading(false);
  };

  const handleAddMembers = async (members: CircleMemberBatchDetails[]) => {
    if (!id) return;

    await RelationshipAPI.addCircleMembers(id as Guid, members);
    setIsAddMembersModalOpen(false);
    loadCircleDetails();
  };

  const handleRemoveMember = async (userId: Guid) => {
    if (!id) return;

    await RelationshipAPI.removeCircleMembers(id as Guid, [{ id: userId }]);
    loadCircleDetails();
  };

  const handleEditMember = async (member: CircleMemberBatchDetails) => {
    if (!id) return;

    await RelationshipAPI.editCircleMembers(id as Guid, [member]);
    loadCircleDetails();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!circleDetails || !circleDetails.info) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Circle not found</h2>
        <button
          onClick={() => router.push("/circles")}
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Circles
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/circles")}
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Circles
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {circleDetails.info.name}
        </h1>
        <div className="flex items-center gap-3 text-gray-600 mb-4">
          <span>Type: {CircleType[circleDetails.info.type]}</span>
          {circleDetails.info.isDefault && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Default
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`py-3 px-4 ${
              activeTab === "members"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("members")}
          >
            Members
          </button>
          <button
            className={`py-3 px-4 ${
              activeTab === "invitations"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("invitations")}
          >
            Invitations
          </button>
        </div>

        {activeTab === "members" && (
          <button
            onClick={() => setIsAddMembersModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add Members
          </button>
        )}
      </div>

      {activeTab === "members" && (
        <MembersList
          members={circleDetails.members || []}
          onRemove={handleRemoveMember}
          onEdit={handleEditMember}
          circleType={circleDetails.info.type}
        />
      )}

      {activeTab === "invitations" && (
        <InvitationsList invitations={circleDetails.invitations || []} />
      )}

      <AddMembersModal
        isOpen={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        onAdd={handleAddMembers}
        circleType={circleDetails.info.type}
      />
    </div>
  );
}
