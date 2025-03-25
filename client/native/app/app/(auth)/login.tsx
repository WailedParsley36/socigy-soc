import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { MfaHelper } from "@/lib/MfaHelper";
import useAwaitedAuthStore, { MFAType } from "@/stores/AuthStore";
import LoadingScreen from "@/components/LoadingScreen";

export default function LoginScreen() {
  // Stores
  const { isLoaded, auth } = useAwaitedAuthStore();

  // Hooks
  const router = useRouter();
  const params = useLocalSearchParams();

  // States
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [tag, setTag] = useState("");

  // Callbacks
  const handleLogin = useCallback(async () => {
    setError(undefined);
    setIsLoading(true);

    try {
      if (loginMethod === "email" && !email) {
        setError("Email is required");
        setIsLoading(false);
        return;
      } else if (loginMethod === "username" && (!username || !tag)) {
        setError("Username and Tag are required");
        setIsLoading(false);
        return;
      }

      const result = await auth.login(
        loginMethod === "email" ? email : undefined,
        loginMethod === "username" ? username : undefined,
        loginMethod === "username" && tag ? parseInt(tag) : undefined
      );

      if (result.error) {
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      // MFA is returned in type
      if (typeof result.result === "number") {
        router.push(MfaHelper.getRouteToMfa(result.result) as any);
      } else {
        router.replace((params.redirectUrl as any) || "/");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [auth, loginMethod, email, username, tag, params, router]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (isLoaded && auth.user) {
    return <Redirect href={"/"} />;
  }

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-4">
      <View className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <View className="items-center">
          <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
          <Text className="mt-2 text-gray-600">Sign in to your account</Text>
        </View>

        {error && (
          <View className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity
            className="flex-1 py-2"
            onPress={() => setLoginMethod("email")}
          >
            <Text
              className={`text-center font-medium text-sm ${
                loginMethod === "email"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500"
              }`}
            >
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2"
            onPress={() => setLoginMethod("username")}
          >
            <Text
              className={`text-center font-medium text-sm ${
                loginMethod === "username"
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500"
              }`}
            >
              Username & Tag
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 space-y-6">
          {loginMethod === "email" ? (
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
              onPress={handleLogin}
              disabled={isLoading}
              className="w-full items-center justify-center py-2 px-4 rounded-md shadow-sm bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="ml-2 text-sm font-medium text-white">
                    Signing in...
                  </Text>
                </View>
              ) : (
                <Text className="text-sm font-medium text-white">Sign in</Text>
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
                router.push(
                  `/register?redirectUrl=${params.redirectUrl || "/"}`
                )
              }
              className="w-full items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              <Text className="text-sm font-medium text-gray-700">
                Create new account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center mt-6">
          <TouchableOpacity onPress={() => router.push("/recover")}>
            <Text className="text-sm font-medium text-blue-600">
              Lost access to your account?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
