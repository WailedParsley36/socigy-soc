"use client";

import { useState, useCallback, useEffect } from "react";
import { ContentAPI } from "@/lib/api/ContentHelper";
import protectRoute from "@/lib/protectRoute";
import Interest, {
  InterestPreference,
} from "@/lib/structures/content/Interest";
import { Guid } from "@/lib/structures/Guid";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import InterestCard from "@/components/registration/InterestCard";
import LoadingScreen from "@/components/LoadingScreen";

export default function Step4() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // States
  const [error, setError] = useState<string>();
  const [loadedInterests, setLoadedInterests] = useState<Interest[]>([]);
  const [popularInterests, setPopularInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<{
    [id: Guid]: InterestPreference;
  }>({});
  const [activeInterest, setActiveInterest] = useState<Guid | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Callbacks
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
      router.replace("/register/step-5");
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

  // Effects
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
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2">
        Personalize based on your interests
      </h1>
      <p className="mb-6 text-gray-600">
        Select interests to see content tailored to you. You can always adjust
        these later.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Recommended Interests</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {loadedInterests.map((interest) => (
          <InterestCard
            key={interest.id}
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
        ))}
      </div>
      <button
        onClick={handleNewInterestLoad}
        disabled={isLoading}
        className="mb-8 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Load more recommended interests ↓"}
      </button>

      <h2 className="text-xl font-semibold mb-4">Popular Interests 🔥</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {popularInterests.map((interest) => (
          <InterestCard
            key={interest.id}
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
        ))}
      </div>
      <button
        onClick={handleGetPopularInterests}
        disabled={isLoading}
        className="mb-8 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Load more popular interests ↓"}
      </button>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleInterestsSubmit}
          disabled={isLoading || Object.keys(selectedInterests).length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Continue →"}
        </button>
      </div>

      {Object.keys(selectedInterests).length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-medium mb-3">
            Selected Interests ({Object.keys(selectedInterests).length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(selectedInterests).map((id) => {
              const interest = [...loadedInterests, ...popularInterests].find(
                (i) => i.id === id
              );
              return interest ? (
                <div
                  key={id}
                  className="flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-full shadow-sm"
                >
                  <span className="mr-2">{interest.emoji}</span>
                  <span>{interest.name}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
