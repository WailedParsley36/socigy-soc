import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import useAwaitedAuthStore, { useAuthStore } from "@/stores/AuthStore";
import protectRoute from "@/lib/protectRoute";
import LoadingScreen from "@/components/LoadingScreen";

export default function RegisterPasskey() {
  // Stores
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // State
  const [error, setError] = useState<string | undefined>();
  const [isRegistering, setIsRegistering] = useState(false);

  // Callbacks
  const handlePasskeyRegister = useCallback(async () => {
    setIsRegistering(true);
    setError(undefined);

    console.log("Registering before", auth);
    if (!auth.user) return;

    try {
      const error = await auth.registerPasskey();
      if (error) {
        setError(error.message);
        return;
      }

      router.replace("/(auth)/(register)/step-2");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  }, [auth, router]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirectTo = protectRoute(auth, {
    allowNonRegistered: true,
    allowNonVerified: false,
  });
  if (redirectTo) return redirectTo;

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-4">
      <View className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <View className="items-center">
          <Text className="text-2xl font-bold text-gray-900">
            Register Passkey
          </Text>
          <Text className="mt-2 text-gray-600 text-center">
            For your safety our network requires you to use Passkeys. To
            register one to your account please click below
          </Text>
        </View>

        {error && (
          <View className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <View className="items-center">
          <TouchableOpacity
            onPress={handlePasskeyRegister}
            disabled={isRegistering}
            className={`px-6 py-3 bg-blue-600 rounded-md ${
              isRegistering ? "opacity-50" : ""
            }`}
          >
            <View className="flex-row items-center justify-center">
              {isRegistering ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white">Registering...</Text>
                </>
              ) : (
                <Text className="text-white">Register Passkey</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View className="mt-4 items-center">
          <Text className="text-sm text-gray-500 text-center">
            Passkeys provide a more secure way to access your account without
            having to remember complex passwords.
          </Text>
        </View>
      </View>
    </View>
  );
}
