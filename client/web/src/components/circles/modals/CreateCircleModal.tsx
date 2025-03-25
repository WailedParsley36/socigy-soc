// components/circles/CreateCircleModal.tsx
import { useState } from "react";
import {
  CircleType,
  EditCircleDetailsRequest,
} from "@/lib/api/RelationshipHelper";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface CreateCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (details: EditCircleDetailsRequest) => void;
}

export default function CreateCircleModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCircleModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CircleType>(CircleType.Mixed);
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      type,
      isDefault,
    });
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setType(CircleType.Mixed);
    setIsDefault(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Create New Circle</h2>
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Circle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter circle name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Circle Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value) as CircleType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.keys(CircleType)
                .filter((key) => isNaN(Number(key)))
                .map((type, index) => (
                  <option key={type} value={index}>
                    {type}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Set as default circle for this type
              </span>
            </label>
          </div>

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
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Create Circle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
