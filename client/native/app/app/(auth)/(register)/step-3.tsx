import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ContentAPI } from "@/lib/api/ContentHelper";
import protectRoute from "@/lib/protectRoute";
import Category, {
  CategoryPreference,
} from "@/lib/structures/content/Category";
import { Guid } from "@/lib/structures/Guid";
import useAwaitedAuthStore from "@/stores/AuthStore";
import CategoryCard from "@/components/registration/CategoryCard";
import LoadingScreen from "@/components/LoadingScreen";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

export default function Step3() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // States
  const [error, setError] = useState<string>();
  const [loadedCategories, setLoadedCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<{
    [id: Guid]: CategoryPreference;
  }>({});
  const [activeCategory, setActiveCategory] = useState<Guid | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Callbacks
  const handleNewCategoryLoad = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ContentAPI.getPopularCategories(
        25,
        loadedCategories.length
      );
      if (response.error) {
        setError(response.error.message);
        return;
      }

      setLoadedCategories([...loadedCategories, ...response.result!]);
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [loadedCategories, setLoadedCategories]);

  const handleCategoriesSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      const error = await ContentAPI.registerDefaultPrefferedCategories(
        Object.keys(selectedCategories).map((x: any) => selectedCategories[x])
      );
      if (error) {
        setError(error.message);
        return;
      }

      router.replace("/(auth)/(register)/step-4");
    } catch (err) {
      setError("Failed to save categories");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategories, router]);

  const handleCategorySelect = useCallback(
    (categoryId: any) => {
      const newSelected = { ...selectedCategories };

      if (selectedCategories[categoryId]) {
        // If already selected, toggle weight adjustment
        setActiveCategory(activeCategory === categoryId ? null : categoryId);
      } else {
        // If not selected, add with default weight
        newSelected[categoryId] = { contentId: categoryId, weight: 500 };
        setSelectedCategories(newSelected);
        setActiveCategory(categoryId);
      }
    },
    [selectedCategories, activeCategory]
  );

  const handleWeightChange = useCallback(
    (categoryId: any, weight: any) => {
      setSelectedCategories({
        ...selectedCategories,
        [categoryId]: { ...selectedCategories[categoryId], weight },
      });
    },
    [selectedCategories]
  );

  const handleRemoveCategory = useCallback(
    (categoryId: any) => {
      const newSelected = { ...selectedCategories };
      delete newSelected[categoryId];
      setSelectedCategories(newSelected);
      if (activeCategory === categoryId) {
        setActiveCategory(null);
      }
    },
    [selectedCategories, activeCategory]
  );

  // Effects
  useEffect(() => {
    if (!isLoaded) return;
    handleNewCategoryLoad();
  }, [isLoaded]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirectTo = protectRoute(auth, {
    allowNonRegistered: true,
    onlyNonRegistered: true,
    allowNonVerified: false,
  });
  if (redirectTo) return redirectTo;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-4 py-8 max-w-6xl mx-auto">
        <Text className="text-2xl font-bold mb-2 dark:text-white">
          Personalize based on your interests
        </Text>
        <Text className="mb-6 text-gray-600 dark:text-gray-400">
          Select categories that interest you to see relevant content. You can
          always change these later.
        </Text>

        {error && (
          <View className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <Text className="text-red-700">{error}</Text>
          </View>
        )}

        <View className="flex-row flex-wrap mb-8">
          {loadedCategories.map((category) => (
            <View
              key={category.id}
              className="w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-2"
            >
              <CategoryCard
                id={category.id}
                name={category.name}
                emoji={category.emoji}
                description={category.description}
                isSelected={!!selectedCategories[category.id]}
                onSelect={handleCategorySelect}
                onWeightChange={handleWeightChange}
                onRemove={handleRemoveCategory}
                weight={selectedCategories[category.id]?.weight}
                showWeightSlider={activeCategory === category.id}
              />
            </View>
          ))}
        </View>

        <View className="flex-col sm:flex-row gap-4 justify-center mt-6">
          <TouchableOpacity
            onPress={handleNewCategoryLoad}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-200 rounded-lg items-center justify-center mb-4 sm:mb-0"
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#4B5563" />
            ) : (
              <Text className="text-gray-800 font-medium">
                Load more categories ↓
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCategoriesSubmit}
            disabled={isLoading || Object.keys(selectedCategories).length === 0}
            className={`px-6 py-2 rounded-lg items-center justify-center ${
              isLoading || Object.keys(selectedCategories).length === 0
                ? "bg-blue-400"
                : "bg-blue-600"
            }`}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-medium">Continue →</Text>
            )}
          </TouchableOpacity>
        </View>

        {Object.keys(selectedCategories).length > 0 && (
          <View className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text className="font-medium mb-3 dark:text-white">
              Selected Categories ({Object.keys(selectedCategories).length})
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {Object.keys(selectedCategories).map((id) => {
                const category = loadedCategories.find((c) => c.id === id);
                return category ? (
                  <View
                    key={id}
                    className="flex-row items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-full shadow-sm"
                  >
                    <Text className="mr-2">{category.emoji}</Text>
                    <Text className="dark:text-white">{category.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
