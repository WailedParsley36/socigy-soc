import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ContentAPI } from "@/lib/api/ContentHelper";
import protectRoute from "@/lib/protectRoute";
import Interest, {
  InterestPreference,
} from "@/lib/structures/content/Interest";
import { Guid } from "@/lib/structures/Guid";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { useRouter } from "expo-router";
import InterestCard from "@/components/registration/InterestCard";
import LoadingScreen from "@/components/LoadingScreen";

export default function Step4() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const [error, setError] = useState<string>();
  const [loadedInterests, setLoadedInterests] = useState<Interest[]>([]);
  const [popularInterests, setPopularInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<{
    [id: Guid]: InterestPreference;
  }>({});
  const [activeInterest, setActiveInterest] = useState<Guid | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNewInterestLoad = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ContentAPI.getRecommendedInterests(
        undefined,
        25,
        loadedInterests.length
      );
      if (response.error) {
        setError(response.error.message);
        return;
      }
      setLoadedInterests([...loadedInterests, ...response.result!]);
    } catch (err) {
      setError("Failed to load recommended interests");
    } finally {
      setIsLoading(false);
    }
  }, [loadedInterests]);

  const handleGetPopularInterests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ContentAPI.getPopularInterests(
        25,
        popularInterests.length
      );
      if (response.error) {
        setError(response.error.message);
        return;
      }
      setPopularInterests([...popularInterests, ...response.result!]);
    } catch (err) {
      setError("Failed to load popular interests");
    } finally {
      setIsLoading(false);
    }
  }, [popularInterests]);

  const handleInterestsSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      const error = await ContentAPI.registerDefaultPrefferedInterests(
        Object.keys(selectedInterests).map((x: any) => selectedInterests[x])
      );
      if (error) {
        setError(error.message);
        return;
      }
      router.replace("/(auth)/(register)/step-5");
    } catch (err) {
      setError("Failed to save interests");
    } finally {
      setIsLoading(false);
    }
  }, [selectedInterests, router]);

  const handleInterestSelect = useCallback(
    (interestId: Guid) => {
      const newSelected = { ...selectedInterests };
      if (selectedInterests[interestId]) {
        setActiveInterest(activeInterest === interestId ? null : interestId);
      } else {
        newSelected[interestId] = { contentId: interestId, weight: 500 };
        setSelectedInterests(newSelected);
        setActiveInterest(interestId);
      }
    },
    [selectedInterests, activeInterest]
  );

  const handleWeightChange = useCallback(
    (interestId: Guid, weight: number) => {
      setSelectedInterests({
        ...selectedInterests,
        [interestId]: { ...selectedInterests[interestId], weight },
      });
    },
    [selectedInterests]
  );

  const handleRemoveInterest = useCallback(
    (interestId: Guid) => {
      const newSelected = { ...selectedInterests };
      delete newSelected[interestId];
      setSelectedInterests(newSelected);
      if (activeInterest === interestId) {
        setActiveInterest(null);
      }
    },
    [selectedInterests, activeInterest]
  );

  useEffect(() => {
    if (!isLoaded) return;
    handleNewInterestLoad();
    handleGetPopularInterests();
  }, [isLoaded]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirectTo = protectRoute(auth, {
    allowNonRegistered: true,
    allowNonVerified: false,
  });
  if (redirectTo) {
    router.replace(redirectTo);
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 px-4 py-8">
      <View className="max-w-6xl mx-auto">
        <Text className="text-2xl font-bold mb-2 dark:text-white">
          Personalize based on your interests
        </Text>
        <Text className="mb-6 text-gray-600 dark:text-gray-400">
          Select interests to see content tailored to you. You can always adjust
          these later.
        </Text>

        {error && (
          <View className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <Text className="text-red-700">{error}</Text>
          </View>
        )}

        <Text className="text-xl font-semibold mb-4 dark:text-white">
          Recommended Interests
        </Text>
        <View className="flex-row flex-wrap mb-8">
          {loadedInterests.map((interest) => (
            <View
              key={interest.id}
              className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 p-2"
            >
              <InterestCard
                id={interest.id}
                name={interest.name}
                emoji={interest.emoji}
                description={interest.description}
                isSelected={!!selectedInterests[interest.id]}
                onSelect={handleInterestSelect}
                onWeightChange={handleWeightChange}
                onRemove={handleRemoveInterest}
                weight={selectedInterests[interest.id]?.weight}
                showWeightSlider={activeInterest === interest.id}
              />
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={handleNewInterestLoad}
          disabled={isLoading}
          className="mb-8 px-6 py-2 bg-gray-200 rounded-lg items-center"
        >
          <Text className="text-gray-800">
            {isLoading ? "Loading..." : "Load more recommended interests ↓"}
          </Text>
        </TouchableOpacity>

        <Text className="text-xl font-semibold mb-4 dark:text-white">
          Popular Interests 🔥
        </Text>
        <View className="flex-row flex-wrap mb-8">
          {popularInterests.map((interest) => (
            <View
              key={interest.id}
              className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 p-2"
            >
              <InterestCard
                id={interest.id}
                name={interest.name}
                emoji={interest.emoji}
                description={interest.description}
                isSelected={!!selectedInterests[interest.id]}
                onSelect={handleInterestSelect}
                onWeightChange={handleWeightChange}
                onRemove={handleRemoveInterest}
                weight={selectedInterests[interest.id]?.weight}
                showWeightSlider={activeInterest === interest.id}
              />
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={handleGetPopularInterests}
          disabled={isLoading}
          className="mb-8 px-6 py-2 bg-gray-200 rounded-lg items-center"
        >
          <Text className="text-gray-800">
            {isLoading ? "Loading..." : "Load more popular interests ↓"}
          </Text>
        </TouchableOpacity>

        <View className="items-center mt-6">
          <TouchableOpacity
            onPress={handleInterestsSubmit}
            disabled={isLoading || Object.keys(selectedInterests).length === 0}
            className="px-6 py-2 bg-blue-600 rounded-lg items-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-medium">Continue →</Text>
            )}
          </TouchableOpacity>
        </View>

        {Object.keys(selectedInterests).length > 0 && (
          <View className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text className="font-medium mb-3 dark:text-white">
              Selected Interests ({Object.keys(selectedInterests).length})
            </Text>
            <View className="flex-row flex-wrap">
              {Object.keys(selectedInterests).map((id) => {
                const interest = [...loadedInterests, ...popularInterests].find(
                  (i) => i.id === id
                );
                return interest ? (
                  <View
                    key={id}
                    className="flex-row items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-full shadow-sm mr-2 mb-2"
                  >
                    <Text className="mr-2">{interest.emoji}</Text>
                    <Text className="dark:text-white">{interest.name}</Text>
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
