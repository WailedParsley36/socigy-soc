import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuthStore } from "@/stores/AuthStore";
import { Checkbox } from "react-native-paper";
import { useRouter } from "expo-router";

export default function EmailMfaPage() {
  const router = useRouter();
  const route = useRoute();
  const auth = useAuthStore();

  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);

  console.log(route);
  console.log(route.params);

  const handleResend = useCallback(async () => {
    setError(undefined);
    setStatus(undefined);
    try {
      const result = await auth.resendEmailMfa();
      if (result) {
        setError(result.message);
      } else {
        setStatus("Email code resent successfully");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  }, [auth]);

  const handleSubmit = useCallback(async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      const result = await auth.submitEmailMfa(code, trustDevice);
      if (result.error) {
        setError(result.error.message);
      } else {
        if (auth.currentFlowUrl?.includes("redirectUrl=")) {
          router.replace(auth.currentFlowUrl.split("redirectUrl=")[1] as any);
        } else {
          router.replace(auth.currentFlowUrl as any);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [router, auth, route.params, code, trustDevice]);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="min-h-screen flex items-center justify-center py-12 px-4">
        <View className="w-full max-w-md space-y-8">
          <View>
            <Text className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Email Verification
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-600">
              Please enter the code sent to your email
            </Text>
          </View>

          <View className="mt-8 space-y-6">
            <View className="rounded-md shadow-sm">
              <TextInput
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                maxLength={6}
                keyboardType="number-pad"
              />
            </View>

            <View className="flex-row items-center">
              <Checkbox
                status={trustDevice ? "checked" : "unchecked"}
                onPress={() => setTrustDevice(!trustDevice)}
              />
              <Text className="ml-2 text-sm text-gray-900">
                Trust this device
              </Text>
            </View>

            {status && (
              <View className="rounded-md bg-green-50 p-4">
                <Text className="text-sm font-medium text-green-800">
                  {status}
                </Text>
              </View>
            )}

            {error && (
              <View className="rounded-md bg-red-50 p-4">
                <Text className="text-sm font-medium text-red-800">
                  {error}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleResend}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Text className="text-sm font-medium">Resend Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Text className="text-sm font-medium text-white">
                {isSubmitting ? "Verifying..." : "Verify"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
