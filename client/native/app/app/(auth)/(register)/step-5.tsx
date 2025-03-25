import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Svg, Path } from "react-native-svg";
import LoadingScreen from "@/components/LoadingScreen";
import { AppComplexity, SettingsAPI } from "@/lib/api/SettingsHelper";
import protectRoute from "@/lib/protectRoute";
import useAwaitedAuthStore from "@/stores/AuthStore";

export default function Step5() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const [complexity, setComplexity] = useState(AppComplexity.Normal);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const error = await SettingsAPI.setComplexity(complexity);
      if (error) {
        setError(error.message);
        return;
      }

      await auth.refreshUserData();
      router.replace("/");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [complexity, auth, router]);

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

  const ComplexityOption = ({ type, title, description, icon }: any) => (
    <TouchableOpacity
      onPress={() => setComplexity(type)}
      className={`border rounded-lg p-6 ${
        complexity === type ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      <View className="items-center mb-4">{icon}</View>
      <Text className="text-xl font-semibold text-center mb-2">{title}</Text>
      <Text className="text-gray-600 text-center">{description}</Text>
      {complexity === type && (
        <View className="mt-4 items-center">
          <Text className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
            Selected
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-white px-4 py-8">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold mb-4 text-center">
          How much complexity can you handle?
        </Text>
        <Text className="text-gray-600 text-center">
          Choose your preferred interface complexity. This affects the number of
          options and features visible in your network. You can always change
          this later in settings.
        </Text>
      </View>

      <View className="mb-10">
        <ComplexityOption
          type={AppComplexity.Simple}
          title="Simple"
          description="Clean, focused interface with only essential features. Perfect for beginners or those who prefer minimalism."
          icon={
            <Svg
              width={64}
              height={64}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
            >
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </Svg>
          }
        />
        <ComplexityOption
          type={AppComplexity.Normal}
          title="Normal"
          description="Balanced interface with a good mix of features and simplicity. Recommended for most users."
          icon={
            <Svg
              width={64}
              height={64}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
            >
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </Svg>
          }
        />
        <ComplexityOption
          type={AppComplexity.Complex}
          title="Complex"
          description="Advanced interface with all features and customization options. Ideal for power users."
          icon={
            <Svg
              width={64}
              height={64}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
            >
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </Svg>
          }
        />
      </View>

      {error && (
        <View className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}

      <View className="items-center">
        <TouchableOpacity
          onPress={handleFinish}
          disabled={isSubmitting}
          className="px-8 py-3 bg-blue-600 rounded-lg"
        >
          {isSubmitting ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" className="mr-2" />
              <Text className="text-white text-lg font-medium">
                Processing...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-lg font-medium">
              Finish Registration
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-8 items-center">
        <Text className="text-gray-500 text-sm text-center">
          You can always change your complexity preferences later in your
          account settings.
        </Text>
      </View>
    </ScrollView>
  );
}
