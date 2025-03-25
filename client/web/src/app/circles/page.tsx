"use client";

import { useState, useEffect } from "react";
import {
  RelationshipAPI,
  UserCircle,
  CircleType,
  EditCircleDetailsRequest,
} from "@/lib/api/RelationshipHelper";
import CircleCard from "@/components/circles/CircleCard";
import CreateCircleModal from "@/components/circles/modals/CreateCircleModal";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Guid } from "@/lib/structures/Guid";

export default function CirclesPage() {
  const [circles, setCircles] = useState<UserCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    setIsLoading(true);
    const response = await RelationshipAPI.listCircles(50, 0);
    if (response.result) {
      setCircles(response.result);
    }
    setIsLoading(false);
  };

  const handleCreateCircle = async (details: EditCircleDetailsRequest) => {
    const response = await RelationshipAPI.createCircle(details);
    if (response.result) {
      setCircles([...circles, response.result]);
      setIsCreateModalOpen(false);
    }
  };

  const handleDeleteCircle = async (circleId: Guid) => {
    await RelationshipAPI.deleteCircle(circleId);
    setCircles(circles.filter((circle) => circle.id !== circleId));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Circles</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Circle
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((circle) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onDelete={handleDeleteCircle}
            />
          ))}
        </div>
      )}

      <CreateCircleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCircle}
      />
    </div>
  );
}
