// components/profile/ProfileHeader.tsx
import { useState, useRef } from "react";
import Image from "next/image";
import { ProfileHelper } from "@/lib/api/ProfileHelper";

export default function ProfileHeader({ profile, user, onProfileUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayNameRef = useRef(null);
  const usernameRef = useRef(null);
  const tagRef = useRef(null);
  const bioRef = useRef(null);
  const avatarFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedProfile = {
        displayName: displayNameRef.current.value,
        username: usernameRef.current.value,
        tag: tagRef.current.value,
        bio: bioRef.current.value,
      };

      // Handle file uploads
      if (avatarFileRef.current?.files?.length) {
        // In a real implementation, you would upload the file to a server
        updatedProfile.avatarUrl = URL.createObjectURL(
          avatarFileRef.current.files[0]
        );
      }

      if (bannerFileRef.current?.files?.length) {
        updatedProfile.bannerUrl = URL.createObjectURL(
          bannerFileRef.current.files[0]
        );
      }

      const result = await ProfileHelper.updateUserProfile(updatedProfile);

      if (result.error) {
        throw new Error(result.error.message);
      }

      onProfileUpdate(updatedProfile);
      setEditMode(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayProfile = profile || user || {};

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-800 to-blue-900">
        {displayProfile.bannerUrl ? (
          <Image
            src={displayProfile.bannerUrl}
            alt="Profile Banner"
            fill
            className="object-cover"
          />
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 -mt-20 relative z-10 mx-4 md:mx-8">
        <div className="flex flex-col md:flex-row items-start md:items-end">
          {/* Avatar */}
          <div className="relative h-32 w-32 rounded-full border-4 border-white dark:border-gray-700 overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 -mt-20 mb-4 md:mb-0 shadow-lg transition-transform hover:scale-105">
            {displayProfile.avatarUrl ? (
              <Image
                src={displayProfile.avatarUrl}
                alt={displayProfile.displayName || "Profile"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white text-4xl font-bold">
                {displayProfile.displayName?.charAt(0) ||
                  user?.displayName?.charAt(0) ||
                  "?"}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="md:ml-6 flex-grow">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {displayProfile.displayName || user?.displayName}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              @{displayProfile.username || user?.username}#
              {displayProfile.tag || user?.tag}
            </p>
            {displayProfile.bio && (
              <p className="text-gray-700 dark:text-gray-300 mt-2 max-w-2xl">
                {displayProfile.bio}
              </p>
            )}
          </div>

          {/* Edit Button */}
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md shadow-md transition-all"
            >
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Edit Profile Form */}
        {editMode && (
          <form
            onSubmit={handleProfileUpdate}
            className="mt-8 border-t pt-6 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  ref={displayNameRef}
                  defaultValue={displayProfile.displayName || user?.displayName}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    ref={usernameRef}
                    defaultValue={displayProfile.username || user?.username}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="tag"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Tag
                  </label>
                  <input
                    id="tag"
                    type="text"
                    ref={tagRef}
                    defaultValue={displayProfile.tag || user?.tag}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  ref={bioRef}
                  defaultValue={displayProfile.bio || ""}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="avatar"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Profile Picture
                </label>
                <input
                  id="avatar"
                  type="file"
                  ref={avatarFileRef}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="banner"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Banner Image
                </label>
                <input
                  id="banner"
                  type="file"
                  ref={bannerFileRef}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
