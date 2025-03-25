// components/registration/InterestCard.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { Guid } from "@/lib/structures/Guid";
import { Svg, Path } from "react-native-svg";

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
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={() => onSelect(id)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={`relative rounded-lg overflow-hidden ${
        isSelected
          ? "bg-green-100 dark:bg-green-900"
          : "bg-white dark:bg-gray-800"
      } ${isPressed ? "scale-105" : "scale-100"}`}
    >
      <View className="p-4">
        <Text className="text-4xl mb-2">{emoji}</Text>
        <Text className="font-medium text-lg mb-1">{name}</Text>
        <Text className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {description}
        </Text>
      </View>

      {isSelected && (
        <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
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
        <View className="p-4 bg-green-50 dark:bg-green-800">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-medium">Interest Level</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
            >
              <Text className="text-xs text-red-600">Remove</Text>
            </TouchableOpacity>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={1000}
            step={100}
            value={weight}
            onValueChange={(value) => onWeightChange(id, value)}
            minimumTrackTintColor="#10B981"
            maximumTrackTintColor="#D1D5DB"
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs">Low Interest</Text>
            <Text className="text-xs">High Interest</Text>
          </View>
        </View>
      )}

      {isSelected && isPressed && !showWeightSlider && (
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

      {isSelected && !showWeightSlider && (
        <View className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <View
            className="h-full bg-green-500"
            style={{ width: `${(weight / 1000) * 100}%` }}
          />
        </View>
      )}
    </Pressable>
  );
}
