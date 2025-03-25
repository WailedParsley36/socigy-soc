// components/registration/CategoryCard.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { Svg, Path } from "react-native-svg";

interface CategoryCardProps {
  id: string; // Assuming Guid is a string in React Native
  name: string;
  emoji: string;
  description: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onWeightChange: (id: string, weight: number) => void;
  onRemove: (id: string) => void;
  weight?: number;
  showWeightSlider: boolean;
}

export default function CategoryCard({
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
}: CategoryCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      className={`relative rounded-lg overflow-hidden ${
        isSelected
          ? "bg-blue-100 dark:bg-blue-900"
          : "bg-white dark:bg-gray-800"
      }`}
      onPress={() => onSelect(id)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <View className="p-4">
        <Text className="text-4xl mb-2">{emoji}</Text>
        <Text className="font-medium text-lg mb-1">{name}</Text>
        <Text
          className="text-sm text-gray-600 dark:text-gray-300"
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {isSelected && (
        <View className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
          <Svg width={16} height={16} viewBox="0 0 20 20" fill="white">
            <Path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </Svg>
        </View>
      )}

      {isSelected && showWeightSlider && (
        <View className="p-4 bg-blue-50 dark:bg-blue-800">
          <Slider
            minimumValue={0}
            maximumValue={1000}
            value={weight}
            onValueChange={(value) => onWeightChange(id, value)}
            className="w-full"
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs">Less</Text>
            <Text className="text-xs">More</Text>
          </View>
        </View>
      )}

      {isSelected && isPressed && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="absolute bottom-2 right-2 bg-red-500 rounded-full p-1"
        >
          <Svg width={16} height={16} viewBox="0 0 20 20" fill="white">
            <Path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </Svg>
        </TouchableOpacity>
      )}
    </Pressable>
  );
}
