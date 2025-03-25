"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ContentProfileHelper,
  ContentProfileVisibility,
  UserContentProfile,
} from "@/lib/api/AiProfileHelper";
import { Guid } from "@/lib/structures/Guid";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect } from "next/navigation";
import protectRoute from "@/lib/protectRoute";
import { Tab } from "@headlessui/react";
import { Transition } from "@headlessui/react";
import Category, {
  CategoryPreference,
} from "@/lib/structures/content/Category";
import Interest, {
  InterestPreference,
} from "@/lib/structures/content/Interest";

export default function AIProfilesPage() {
  const { isLoaded, auth } = useAwaitedAuthStore();

  // States
  const [profiles, setProfiles] = useState<UserContentProfile[]>([]);
  const [selectedProfile, setSelectedProfile] =
    useState<UserContentProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [popularInterests, setPopularInterests] = useState<Interest[]>([]);
  const [recommendedInterests, setRecommendedInterests] = useState<Interest[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDescription, setNewProfileDescription] = useState("");
  const [newProfileVisibility, setNewProfileVisibility] =
    useState<ContentProfileVisibility>(ContentProfileVisibility.Private);

  // Load profiles
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, you would fetch the profiles from the API
      // For now, we'll use mock data
      const mockProfiles: UserContentProfile[] = [
        {
          id: "profile1" as Guid,
          name: "Default Profile",
          description: "My default content profile",
          isDefault: true,
          owner: auth.user?.id as Guid,
          visibility: ContentProfileVisibility.Private,
        },
        {
          id: "profile2" as Guid,
          name: "Work Profile",
          description: "Professional content preferences",
          isDefault: false,
          owner: auth.user?.id as Guid,
          visibility: ContentProfileVisibility.Public,
        },
      ];
      setProfiles(mockProfiles);
      setSelectedProfile(mockProfiles[0]);
    } catch (err) {
      setError("Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  }, [auth.user]);

  // Load profile data
  const fetchProfileData = useCallback(async (profileId: Guid) => {
    setIsLoading(true);
    setError(null);

    try {
      const [categoriesResult, interestsResult] = await Promise.all([
        ContentProfileHelper.getPreferredCategories(profileId),
        ContentProfileHelper.getPreferredInterests(profileId),
      ]);

      if (categoriesResult.error)
        throw new Error(categoriesResult.error.message);
      if (interestsResult.error) throw new Error(interestsResult.error.message);

      setCategories(categoriesResult.result || []);
      setInterests(interestsResult.result || []);
    } catch (err) {
      setError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load popular and recommended data
  const fetchPopularAndRecommended = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        popularCategoriesResult,
        popularInterestsResult,
        recommendedInterestsResult,
      ] = await Promise.all([
        ContentProfileHelper.getPopularCategories(),
        ContentProfileHelper.getPopularInterests(),
        ContentProfileHelper.getRecommendedInterests(
          selectedProfile?.id as Guid
        ),
      ]);

      if (popularCategoriesResult.error)
        throw new Error(popularCategoriesResult.error.message);
      if (popularInterestsResult.error)
        throw new Error(popularInterestsResult.error.message);
      if (recommendedInterestsResult.error)
        throw new Error(recommendedInterestsResult.error.message);

      setPopularCategories(popularCategoriesResult.result || []);
      setPopularInterests(popularInterestsResult.result || []);
      setRecommendedInterests(recommendedInterestsResult.result || []);
    } catch (err) {
      setError("Failed to load popular and recommended data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfile]);

  // Create profile
  const handleCreateProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ContentProfileHelper.createContentProfile({
        name: newProfileName,
        description: newProfileDescription,
        visibility: newProfileVisibility,
      });

      if (result.error) throw new Error(result.error.message);

      setSuccess("Profile created successfully");
      setShowCreateModal(false);
      fetchProfiles();
    } catch (err) {
      setError("Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  }, [
    newProfileName,
    newProfileDescription,
    newProfileVisibility,
    fetchProfiles,
  ]);

  // Edit profile
  const handleEditProfile = useCallback(async () => {
    if (!selectedProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await ContentProfileHelper.editContentProfile({
        id: selectedProfile.id,
        name: newProfileName || selectedProfile.name,
        description: newProfileDescription || selectedProfile.description,
        visibility: newProfileVisibility,
      });

      if (result.error) throw new Error(result.error.message);

      setSuccess("Profile updated successfully");
      setShowEditModal(false);
      fetchProfiles();
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedProfile,
    newProfileName,
    newProfileDescription,
    newProfileVisibility,
    fetchProfiles,
  ]);

  // Delete profile
  const handleDeleteProfile = useCallback(
    async (profileId: Guid) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await ContentProfileHelper.deleteContentProfile(
          profileId
        );

        if (result.error) throw new Error(result.error.message);

        setSuccess("Profile deleted successfully");
        fetchProfiles();
      } catch (err) {
        setError("Failed to delete profile");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProfiles]
  );

  // Update preferences
  const handleUpdatePreferences = useCallback(
    async (
      type: "categories" | "interests",
      preferences: CategoryPreference[] | InterestPreference[]
    ) => {
      if (!selectedProfile) return;

      setIsLoading(true);
      setError(null);

      try {
        const result =
          type === "categories"
            ? await ContentProfileHelper.updatePreferredCategories(
                selectedProfile.id,
                preferences as CategoryPreference[]
              )
            : await ContentProfileHelper.updatePreferredInterests(
                selectedProfile.id,
                preferences as InterestPreference[]
              );

        if (result.error) throw new Error(result.error.message);

        setSuccess(
          `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`
        );
        fetchProfileData(selectedProfile.id);
      } catch (err) {
        setError(`Failed to update ${type}`);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedProfile, fetchProfileData]
  );

  // Effects
  useEffect(() => {
    if (isLoaded) {
      fetchProfiles();
    }
  }, [isLoaded, fetchProfiles]);

  useEffect(() => {
    if (selectedProfile) {
      fetchProfileData(selectedProfile.id);
      fetchPopularAndRecommended();
    }
  }, [selectedProfile, fetchProfileData, fetchPopularAndRecommended]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          AI Profiles
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profiles List */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Profiles
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Create Profile
                </button>
              </div>

              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedProfile?.id === profile.id
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {profile.description}
                  </p>
                  {profile.isDefault && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-1 inline-block">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2">
            {selectedProfile ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {selectedProfile.name}
                  </h2>
                  <div className="space-x-2">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    {!selectedProfile.isDefault && (
                      <button
                        onClick={() => handleDeleteProfile(selectedProfile.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                    {["Categories", "Interests", "Recommendations"].map(
                      (category, index) => (
                        <Tab
                          key={category}
                          className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                              selected
                                ? "bg-white shadow"
                                : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                            }`
                          }
                        >
                          {category}
                        </Tab>
                      )
                    )}
                  </Tab.List>
                  <Tab.Panels className="mt-2">
                    <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                      <h3 className="text-lg font-medium mb-2">
                        Preferred Categories
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`category-${category.id}`}
                              checked={true} // You'd need to track this state
                              onChange={() => {}} // You'd need to implement this
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="text-sm text-gray-700"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          handleUpdatePreferences("categories", [])
                        } // You'd need to pass actual preferences
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Update Categories
                      </button>
                    </Tab.Panel>
                    <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                      <h3 className="text-lg font-medium mb-2">
                        Preferred Interests
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {interests.map((interest) => (
                          <div
                            key={interest.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`interest-${interest.id}`}
                              checked={true} // You'd need to track this state
                              onChange={() => {}} // You'd need to implement this
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <label
                              htmlFor={`interest-${interest.id}`}
                              className="text-sm text-gray-700"
                            >
                              {interest.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleUpdatePreferences("interests", [])} // You'd need to pass actual preferences
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Update Interests
                      </button>
                    </Tab.Panel>
                    <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                      <h3 className="text-lg font-medium mb-2">
                        Recommended Interests
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {recommendedInterests.map((interest) => (
                          <div
                            key={interest.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`recommended-${interest.id}`}
                              checked={false} // Initially unchecked
                              onChange={() => {}} // You'd need to implement this
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <label
                              htmlFor={`recommended-${interest.id}`}
                              className="text-sm text-gray-700"
                            >
                              {interest.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleUpdatePreferences("interests", [])} // You'd need to pass actual preferences
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Add Selected Interests
                      </button>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Profile
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Select a profile from the list to view and manage its content
                  preferences
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Create Profile
            </h2>

            <form onSubmit={handleCreateProfile}>
              <div className="mb-4">
                <label
                  htmlFor="profileName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Profile Name
                </label>
                <input
                  id="profileName"
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="profileDescription"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="profileDescription"
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                ></textarea>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="profileVisibility"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Visibility
                </label>
                <select
                  id="profileVisibility"
                  value={newProfileVisibility}
                  onChange={(e) =>
                    setNewProfileVisibility(parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={ContentProfileVisibility.Private}>
                    Private
                  </option>
                  <option value={ContentProfileVisibility.Public}>
                    Public
                  </option>
                  <option value={ContentProfileVisibility.CirclesOnly}>
                    Circles Only
                  </option>
                  <option value={ContentProfileVisibility.CustomCircles}>
                    Custom Circles
                  </option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Profile
            </h2>

            <form onSubmit={handleEditProfile}>
              <div className="mb-4">
                <label
                  htmlFor="editProfileName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Profile Name
                </label>
                <input
                  id="editProfileName"
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="editProfileDescription"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="editProfileDescription"
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                ></textarea>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="editProfileVisibility"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Visibility
                </label>
                <select
                  id="editProfileVisibility"
                  value={newProfileVisibility}
                  onChange={(e) =>
                    setNewProfileVisibility(parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={ContentProfileVisibility.Private}>
                    Private
                  </option>
                  <option value={ContentProfileVisibility.Public}>
                    Public
                  </option>
                  <option value={ContentProfileVisibility.CirclesOnly}>
                    Circles Only
                  </option>
                  <option value={ContentProfileVisibility.CustomCircles}>
                    Custom Circles
                  </option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
