// components/registration/InterestCard.tsx
import { useState } from "react";
import { Guid } from "@/lib/structures/Guid";

interface InterestCardProps {
  id: Guid;
  name: string;
  emoji: string;
  description: string;
  isSelected: boolean;
  onSelect: (id: Guid) => void;
  onWeightChange: (id: Guid, weight: number) => void;
  onRemove: (id: Guid) => void;
  weight?: number;
  showWeightSlider: boolean;
}

export default function InterestCard({
  id,
  name,
  emoji,
  description,
  isSelected,
  onSelect,
  onWeightChange,
  onRemove,
  weight = 500,
  showWeightSlider,
}: InterestCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative rounded-lg transition-all transform hover:scale-105 cursor-pointer shadow-sm overflow-hidden ${
        isSelected
          ? "bg-green-100 dark:bg-green-900"
          : "bg-white dark:bg-gray-800"
      }`}
      onClick={() => onSelect(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="text-4xl mb-2">{emoji}</div>
        <h3 className="font-medium text-lg mb-1">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {description}
        </p>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {isSelected && showWeightSlider && (
        <div className="p-4 bg-green-50 dark:bg-green-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Interest Level</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="100"
            value={weight}
            onChange={(e) => onWeightChange(id, parseInt(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>Low Interest</span>
            <span>High Interest</span>
          </div>
        </div>
      )}

      {isSelected && isHovered && !showWeightSlider && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="absolute bottom-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          aria-label="Remove interest"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Interest Level Indicator */}
      {isSelected && !showWeightSlider && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-green-500"
            style={{ width: `${(weight / 1000) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
