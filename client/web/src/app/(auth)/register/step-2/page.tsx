"use client";

import LoadingScreen from "@/components/LoadingScreen";
import protectRoute from "@/lib/protectRoute";
import { Sex } from "@/lib/structures/Enums";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import { FormEvent, useCallback, useRef, useState } from "react";

export default function Step2() {
  // Stores
  const { isLoaded, auth } = useAwaitedAuthStore();

  // States
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const router = useRouter();

  // Refs
  const birthRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Callbacks
  const handleFormSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!birthRef.current || !selectRef.current) return null;

      setIsSubmitting(true);
      setError(undefined);

      try {
        const result = await auth.submitRegistrationStep2(
          new Date(Date.parse(birthRef.current.value)),
          parseInt(selectRef.current.value)
        );

        if (result.error) {
          setError(result.error.message);
          return;
        }

        if (result.result!) {
          router.push("/register/parent-link");
        } else {
          router.push("/register/step-3");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [auth, router]
  );

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirectTo = protectRoute(auth, {
    allowNonRegistered: true,
    onlyNonRegistered: true,
    allowNonVerified: false,
  });
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Let's finish creating your account
          </h1>
          <p className="mt-2 text-gray-600">
            Before we let you in, we need to know more things about you. Don't
            worry you can change these later
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="birthdate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of Birth
            </label>
            <input
              id="birthdate"
              ref={birthRef}
              required
              type="date"
              autoComplete="bday-day"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="sex"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sex
            </label>
            <select
              id="sex"
              required
              ref={selectRef}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={Sex.PreferNotToSay}>Prefer not to say</option>
              <option value={Sex.Male}>Male</option>
              <option value={Sex.Female}>Female</option>
              <option value={Sex.Other}>Other</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              This will not be shared with others, unless you enable it in the{" "}
              <b>Privacy Settings</b>
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
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
                </>
              ) : (
                "Continue →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
