"use client";

import { useState, useCallback, useEffect } from "react";
import { ContentAPI } from "@/lib/api/ContentHelper";
import protectRoute from "@/lib/protectRoute";
import Category, {
  CategoryPreference,
} from "@/lib/structures/content/Category";
import { Guid } from "@/lib/structures/Guid";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import CategoryCard from "@/components/registration/CategoryCard";
import LoadingScreen from "@/components/LoadingScreen";

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

      router.replace("/register/step-4");
    } catch (err) {
      setError("Failed to save categories");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategories, router]);

  const handleCategorySelect = useCallback(
    (categoryId: Guid) => {
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
    (categoryId: Guid, weight: number) => {
      setSelectedCategories({
        ...selectedCategories,
        [categoryId]: { ...selectedCategories[categoryId], weight },
      });
    },
    [selectedCategories]
  );

  const handleRemoveCategory = useCallback(
    (categoryId: Guid) => {
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
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2">
        Personalize based on your interests
      </h1>
      <p className="mb-6 text-gray-600">
        Select categories that interest you to see relevant content. You can
        always change these later.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {loadedCategories.map((category) => (
          <CategoryCard
            key={category.id}
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
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <button
          onClick={handleNewCategoryLoad}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <>
              Load more categories<span className="ml-1">↓</span>
            </>
          )}
        </button>

        <button
          onClick={handleCategoriesSubmit}
          disabled={isLoading || Object.keys(selectedCategories).length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>
              Continue<span className="ml-1">→</span>
            </>
          )}
        </button>
      </div>

      {Object.keys(selectedCategories).length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-medium mb-3">
            Selected Categories ({Object.keys(selectedCategories).length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(selectedCategories).map((id) => {
              const category = loadedCategories.find((c) => c.id === id);
              return category ? (
                <div
                  key={id}
                  className="flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-full shadow-sm"
                >
                  <span className="mr-2">{category.emoji}</span>
                  <span>{category.name}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
