import React, { useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

interface SearchBarProps {
  initialQuery?: string;
}

export default function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [search, setSearch] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = () => {
    if (search.trim()) {
      router.push(`/app/plugins/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <View className="relative">
      <View className="flex-row items-center">
        <TextInput
          placeholder="Search plugins..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSubmit}
          className="flex-1 p-4 pl-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
        />
        <View className="absolute left-4">
          <Feather name="search" size={20} color="#9CA3AF" />
        </View>
        <Pressable
          onPress={handleSubmit}
          className="absolute right-4 px-4 py-2 bg-blue-600 rounded-md active:bg-blue-700"
        >
          <Text className="text-white">Search</Text>
        </Pressable>
      </View>
    </View>
  );
}
