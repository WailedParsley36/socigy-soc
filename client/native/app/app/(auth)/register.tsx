import React, { useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import RegisterForm from "@/components/auth/RegisterForm";
import LoadingScreen from "@/components/LoadingScreen";
import { Guid } from "@/lib/structures/Guid";
import useAwaitedAuthStore from "@/stores/AuthStore";

export default function RegisterScreen() {
  const params = useLocalSearchParams();
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const handleBasicRegistrationSuccess = useCallback(
    (userId: Guid) => {
      router.replace("/(auth)/(mfa)/email");
    },
    [router]
  );

  if (isLoaded && auth.user) {
    return <Redirect href={"/"} />;
  }

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-4">
      <View className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <View className="items-center">
          <Text className="text-3xl font-bold text-gray-900">
            Create Account
          </Text>
          <Text className="mt-2 text-sm text-gray-600">
            Join our community today
          </Text>
        </View>

        <RegisterForm onSuccess={handleBasicRegistrationSuccess} />

        <View className="mt-6">
          <View className="relative py-2">
            <View className="absolute inset-0 flex items-center justify-center">
              <View className="w-full border-t border-gray-300" />
            </View>
            <View className="relative flex justify-center">
              <View className="bg-white px-2">
                <Text className="text-gray-500 text-sm">
                  Already have an account?
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-6">
            <TouchableOpacity
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace(
                      `/login?redirectUrl=${params.redirectUrl || "/"}`
                    )
              }
              className="w-full items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              <Text className="text-sm font-medium text-gray-700">
                Sign in to your account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
