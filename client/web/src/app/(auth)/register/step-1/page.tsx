"use client";

import protectRoute from "@/lib/protectRoute";
import { User } from "@/lib/structures/User";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function RegisterPasskey() {
  // Stores
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // State
  const [error, setError] = useState<string>();
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

      router.replace("/register/step-2");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  }, [auth, router]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const redirectTo = protectRoute(auth, {
    allowNonRegistered: true,
    allowNonVerified: false,
  });
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Register Passkey</h1>
          <p className="mt-2 text-gray-600">
            For your safety our network requires you to use Passkeys. To
            register one to your account please click below
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handlePasskeyRegister}
            disabled={isRegistering}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRegistering ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
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
                Registering...
              </>
            ) : (
              "Register Passkey"
            )}
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            Passkeys provide a more secure way to access your account without
            having to remember complex passwords.
          </p>
        </div>
      </div>
    </div>
  );
}
