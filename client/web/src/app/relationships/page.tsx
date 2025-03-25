"use client";

import { useState, useEffect } from "react";
import {
  RelationshipAPI,
  UserJoinedRelationship,
  RelationshipType,
  RelationshipStatus,
  RelationshipDetailsRequest,
} from "@/lib/api/RelationshipHelper";
import RelationshipCard from "@/components/relationships/RelationshipCard";
import RelationshipTypeSelector from "@/components/relationships/RelationshipTypeSelector";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import SendRelationshipModal from "@/components/relationships/modals/SendRelationshipModal";
import { Guid } from "@/lib/structures/Guid";

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState<UserJoinedRelationship[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<RelationshipType>(
    RelationshipType.Following
  );
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    loadRelationships();
  }, [selectedType]);

  const loadRelationships = async () => {
    setIsLoading(true);
    const response = await RelationshipAPI.listRelationships(
      selectedType,
      50,
      0
    );
    if (response.result) {
      setRelationships(response.result);
    }
    setIsLoading(false);
  };

  const handleSendRelationship = async (
    request: RelationshipDetailsRequest
  ) => {
    await RelationshipAPI.sendRelationship(request);
    setIsSendModalOpen(false);
    loadRelationships();
  };

  const handleRemoveRelationship = async (targetUserId: Guid) => {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
      type: selectedType,
      status: RelationshipStatus.Remove,
    };
    await RelationshipAPI.setRelationshipStatus(request);
    loadRelationships();
  };

  const handleAcceptRelationship = async (targetUserId: Guid) => {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
      type: selectedType,
      status: RelationshipStatus.Accepted,
    };
    await RelationshipAPI.setRelationshipStatus(request);
    loadRelationships();
  };

  const handleRejectRelationship = async (targetUserId: Guid) => {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
      type: selectedType,
      status: RelationshipStatus.Rejected,
    };
    await RelationshipAPI.setRelationshipStatus(request);
    loadRelationships();
  };

  const handleBlockUser = async (targetUserId: Guid) => {
    await RelationshipAPI.blockUser(targetUserId);
    loadRelationships();
  };
  const handleUnblockUser = async (targetUserId: Guid) => {
    await RelationshipAPI.unblockUser(targetUserId);
    loadRelationships();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Relationships</h1>
        <button
          onClick={() => setIsSendModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <UserPlusIcon className="h-5 w-5" />
          Connect with User
        </button>
      </div>

      <RelationshipTypeSelector
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {relationships.length > 0 ? (
            relationships.map((relationship) => (
              <RelationshipCard
                key={relationship.targetId}
                relationship={relationship}
                onRemove={handleRemoveRelationship}
                onAccept={handleAcceptRelationship}
                onReject={handleRejectRelationship}
                onBlock={handleBlockUser}
                onUnblock={handleUnblockUser}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">
                No {RelationshipType[selectedType].toLowerCase()} relationships
                found.
              </p>
            </div>
          )}
        </div>
      )}

      <SendRelationshipModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendRelationship}
      />
    </div>
  );
}
