import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { ErrorResponse } from "@/lib/structures/ErrorResponse";
import { Guid } from "@/lib/structures/Guid";
import { RegisterUserData, useAuthStore } from "@/stores/AuthStore";

interface RegisterFormProps {
  onSubmit?: (data: RegisterUserData) => void;
  onError?: (error: ErrorResponse) => void;
  onSuccess?: (userId: Guid) => void;
}

export default function RegisterForm({
  onSubmit,
  onError,
  onSuccess,
}: RegisterFormProps) {
  const { register } = useAuthStore();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for form inputs
  const [username, setUsername] = useState("");
  const [tag, setTag] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const submitRegistrationForm = useCallback(async () => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const data = {
        username,
        tag: Number.parseInt(tag),
        email,
        fullName,
      };

      onSubmit && onSubmit(data);
      const result = await register(data);

      if (result.error) {
        setError(result.error.message);
        onError && onError(result.error);
        return;
      }

      onSuccess && onSuccess(result.result!);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [onError, onSubmit, onSuccess, register, username, tag, email, fullName]);

  return (
    <View className="space-y-6">
      {error && (
        <View className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      <View className="space-y-4">
        <View>
          <Text className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400"
          />
        </View>

        <View>
          <Text className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400"
          />
        </View>

        <View>
          <Text className="block text-sm font-medium text-gray-700 mb-1">
            Username & Tag
          </Text>
          <View className="flex-row space-x-2">
            <View className="flex-1">
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="Username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400"
              />
            </View>
            <View className="w-24 relative">
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
      </View>

      <View>
        <TouchableOpacity
          onPress={submitRegistrationForm}
          disabled={isSubmitting}
          className="w-full items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="ml-2 text-sm font-medium text-white">
                Creating Account...
              </Text>
            </View>
          ) : (
            <Text className="text-sm font-medium text-white">
              Create Account
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text className="text-xs text-center text-gray-500 mt-8">
        By registering, you agree to our{" "}
        <Link href="/terms" className="text-blue-600">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-blue-600">
          Privacy Policy
        </Link>
      </Text>
    </View>
  );
}
