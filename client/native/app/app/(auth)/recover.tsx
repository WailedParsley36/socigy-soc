import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { MfaHelper } from "@/lib/MfaHelper";
import useAwaitedAuthStore, { MFAType } from "@/stores/AuthStore";
import LoadingScreen from "@/components/LoadingScreen";

export default function RecoverAccount() {
  // Stores
  const { isLoaded, auth } = useAwaitedAuthStore();

  // Hooks
  const router = useRouter();
  const params = useLocalSearchParams();

  // States
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState("email");

  // Form state
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [tag, setTag] = useState("");

  // Callbacks
  const handleRecovery = useCallback(async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      if (recoveryMethod === "email" && !email) {
        setError("Email is required");
        setIsSubmitting(false);
        return;
      } else if (recoveryMethod === "username" && (!username || !tag)) {
        setError("Username and Tag are required");
        setIsSubmitting(false);
        return;
      }

      const result = await auth.recoverAccount(
        recoveryMethod === "email" ? email : undefined,
        recoveryMethod === "username" ? username : undefined,
        recoveryMethod === "username" && tag ? parseInt(tag) : undefined
      );

      if (result.error) {
        setError(result.error.message);
        setIsSubmitting(false);
        return;
      }

      // MFA is returned in type
      if (typeof result.result === "number") {
        router.push(MfaHelper.getRouteToMfa(result.result as MFAType) as any);
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [auth, recoveryMethod, router, email, username, tag]);

  if (isLoaded && auth.user) {
    router.replace("/");
    return null;
  }

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-4">
      <View className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <View className="items-center">
          <Text className="text-3xl font-bold text-gray-900">
            Account Recovery
          </Text>
          <Text className="mt-2 text-gray-600">
            Recover access to your account
          </Text>
        </View>

        {error && (
          <View className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity
            className="flex-1 py-2"
            onPress={() => setRecoveryMethod("email")}
          >
            <Text
              className={`text-center font-medium text-sm ${
                recoveryMethod === "email"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500"
              }`}
            >
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2"
            onPress={() => setRecoveryMethod("username")}
          >
            <Text
              className={`text-center font-medium text-sm ${
                recoveryMethod === "username"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500"
              }`}
            >
              Username & Tag
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 space-y-6">
          {recoveryMethod === "email" ? (
            <View>
              <Text className="block text-sm font-medium text-gray-700">
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="your.email@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400"
              />
            </View>
          ) : (
            <View className="space-y-4">
              <View>
                <Text className="block text-sm font-medium text-gray-700">
                  Username
                </Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholder="Username"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400"
                />
              </View>
              <View>
                <Text className="block text-sm font-medium text-gray-700">
                  Tag
                </Text>
                <View className="mt-1 relative rounded-md shadow-sm">
                  <View className="flex-row items-center border border-gray-300 rounded-md">
                    <Text className="pl-3 text-gray-500">#</Text>
                    <TextInput
                      value={tag}
                      onChangeText={setTag}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="0000"
                      className="flex-1 py-2 px-2"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          <View>
            <TouchableOpacity
              onPress={handleRecovery}
              disabled={isSubmitting}
              className="w-full items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="ml-2 text-sm font-medium text-white">
                    Processing...
                  </Text>
                </View>
              ) : (
                <Text className="text-sm font-medium text-white">
                  Recover Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-6">
          <View className="relative py-2">
            <View className="absolute inset-0 flex items-center justify-center">
              <View className="w-full border-t border-gray-300" />
            </View>
            <View className="relative flex justify-center">
              <View className="bg-white px-2">
                <Text className="text-gray-500 text-sm">Or</Text>
              </View>
            </View>
          </View>

          <View className="mt-6">
            <TouchableOpacity
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace("/(auth)/login")
              }
              className="w-full items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              <Text className="text-sm font-medium text-gray-700">
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center mt-6">
          <Text className="text-gray-600">
            Need help?{" "}
            <Text className="font-medium text-blue-600">Contact Support</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
