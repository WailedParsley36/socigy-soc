"use client";
import LoadingScreen from "@/components/LoadingScreen";
import { AppComplexity, SettingsAPI } from "@/lib/api/SettingsHelper";
import protectRoute from "@/lib/protectRoute";
import useAwaitedAuthStore from "@/stores/AuthStore";
import clsx from "clsx";
import { redirect, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function Step5() {
  // Stores
  const { isLoaded, auth } = useAwaitedAuthStore();

  // Hooks
  const router = useRouter();

  // States
  const [complexity, setComplexity] = useState<AppComplexity>(
    AppComplexity.Normal
  );
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Callbacks
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
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">
          How much complexity can you handle?
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Choose your preferred interface complexity. This affects the number of
          options and features visible in your network. You can always change
          this later in settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Simple Option */}
        <div
          onClick={() => setComplexity(AppComplexity.Simple)}
          className={clsx(
            "border rounded-lg p-6 cursor-pointer transition-all transform hover:scale-105",
            complexity === AppComplexity.Simple
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-gray-200 hover:border-blue-300"
          )}
        >
          <div className="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Simple</h3>
          <p className="text-gray-600 text-center">
            Clean, focused interface with only essential features. Perfect for
            beginners or those who prefer minimalism.
          </p>
          {complexity === AppComplexity.Simple && (
            <div className="mt-4 flex justify-center">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                Selected
              </span>
            </div>
          )}
        </div>

        {/* Normal Option */}
        <div
          onClick={() => setComplexity(AppComplexity.Normal)}
          className={clsx(
            "border rounded-lg p-6 cursor-pointer transition-all transform hover:scale-105",
            complexity === AppComplexity.Normal
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-gray-200 hover:border-blue-300"
          )}
        >
          <div className="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Normal</h3>
          <p className="text-gray-600 text-center">
            Balanced interface with a good mix of features and simplicity.
            Recommended for most users.
          </p>
          {complexity === AppComplexity.Normal && (
            <div className="mt-4 flex justify-center">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                Selected
              </span>
            </div>
          )}
        </div>

        {/* Complex Option */}
        <div
          onClick={() => setComplexity(AppComplexity.Complex)}
          className={clsx(
            "border rounded-lg p-6 cursor-pointer transition-all transform hover:scale-105",
            complexity === AppComplexity.Complex
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-gray-200 hover:border-blue-300"
          )}
        >
          <div className="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Complex</h3>
          <p className="text-gray-600 text-center">
            Advanced interface with all features and customization options.
            Ideal for power users.
          </p>
          {complexity === AppComplexity.Complex && (
            <div className="mt-4 flex justify-center">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                Selected
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleFinish}
          disabled={isSubmitting}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg font-medium"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Processing...
            </div>
          ) : (
            "Finish Registration"
          )}
        </button>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          You can always change your complexity preferences later in your
          account settings.
        </p>
      </div>
    </div>
  );
}
