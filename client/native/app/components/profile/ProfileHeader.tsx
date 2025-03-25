import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
import { ProfileHelper } from "@/lib/api/ProfileHelper";
import { router } from "expo-router";
import useAwaitedAuthStore from "@/stores/AuthStore";
import LoadingScreen from "../LoadingScreen";
import protectRoute from "@/lib/protectRoute";

export default function ProfileHeader({ profile, user, onProfileUpdate }) {
  const { isLoaded, auth } = useAwaitedAuthStore();

  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ""
  );
  const [username, setUsername] = useState(
    profile?.username || user?.username || ""
  );
  const [tag, setTag] = useState(profile?.tag || user?.tag || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerUrl || "");

  const handleProfileUpdate = async () => {
    setIsSubmitting(true);

    try {
      const updatedProfile = {
        displayName,
        username,
        tag,
        bio,
        avatarUrl,
        bannerUrl,
      };

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

  const pickImage = async (type: "avatar" | "banner") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      if (type === "avatar") {
        setAvatarUrl(result.assets[0].uri);
      } else {
        setBannerUrl(result.assets[0].uri);
      }
    }
  };

  if (!isLoaded) return <LoadingScreen />;
  const redirect = protectRoute(auth);
  if (redirect) return redirect;

  return (
    <View className="relative">
      {/* Banner */}
      <View className="h-48 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-800 to-blue-900">
        {bannerUrl && (
          <Image
            source={{ uri: bannerUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        )}
        <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </View>

      {/* Profile Info Card */}
      <View className="bg-white rounded-xl shadow-lg p-6 -mt-20 relative z-10 mx-4">
        <View className="flex-col items-start">
          {/* Avatar */}
          <View className="relative h-32 w-32 rounded-full border-4 border-white overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 -mt-20 mb-4 shadow-lg">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Text className="text-white text-4xl font-bold">
                  {displayName.charAt(0) || "?"}
                </Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View className="flex-grow">
            <Text className="text-2xl font-bold text-gray-900">
              {displayName}
            </Text>
            <Text className="text-gray-600">
              @{username}#{tag}
            </Text>
            {bio && <Text className="text-gray-700 mt-2 max-w-2xl">{bio}</Text>}
          </View>

          <View className="flex">
            {/* Edit Button */}
            <View className="mt-4">
              <TouchableOpacity
                onPress={() => setEditMode(!editMode)}
                className="px-4 py-2 bg-blue-600 rounded-md"
              >
                <Text className="text-white">
                  {editMode ? "Cancel" : "Edit Profile"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <View className="mt-4">
              <TouchableOpacity
                onPress={() => {
                  auth.logout();
                  
                }}
                className="px-4 py-2 bg-red-600 rounded-md"
              >
                <Text className="text-white">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Edit Profile Form */}
        {editMode && (
          <View className="mt-8 border-t pt-6">
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </View>

              <View className="flex-row space-x-2">
                <View className="flex-grow">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Username
                  </Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </View>
                <View className="w-20">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Tag
                  </Text>
                  <TextInput
                    value={tag}
                    onChangeText={setTag}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Bio
                </Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </View>

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => pickImage("avatar")}
                  className="px-4 py-2 bg-blue-600 rounded-md"
                >
                  <Text className="text-white">Choose Profile Picture</Text>
                </TouchableOpacity>
              </View>

              <View className="flex items-center mt-6">
                <TouchableOpacity
                  onPress={handleProfileUpdate}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 rounded-md"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white">Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
