"use client";

import LoadingScreen from "@/components/LoadingScreen";
import { MfaHelper } from "@/lib/MfaHelper";
import useAwaitedAuthStore, { MFAType } from "@/stores/AuthStore";
import Link from "next/link";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useRef, useState } from "react";

export function RecoverAccount() {
  // Stores
  const { isLoaded, auth } = useAwaitedAuthStore();

  // Hooks
  const router = useRouter();
  const params = useSearchParams();

  // States
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<"email" | "username">(
    "email"
  );

  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);

  // Callbacks
  const handleRecovery = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(undefined);
      setIsSubmitting(true);

      try {
        if (recoveryMethod === "email" && !emailRef.current?.value) {
          setError("Email is required");
          return;
        } else if (
          recoveryMethod === "username" &&
          (!usernameRef.current?.value || !tagRef.current?.value)
        ) {
          setError("Username and Tag are required");
          return;
        }

        const result = await auth.recoverAccount(
          recoveryMethod === "email" ? emailRef.current?.value : undefined,
          recoveryMethod === "username"
            ? usernameRef.current?.value
            : undefined,
          recoveryMethod === "username" && tagRef.current?.value
            ? parseInt(tagRef.current.value)
            : undefined
        );

        if (result.error) {
          setError(result.error.message);
          return;
        }

        // MFA is returned in type
        if (typeof result.result === "number") {
          router.push(MfaHelper.getRouteToMfa(result.result as MFAType));
        } else {
          router.replace("/");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [auth, recoveryMethod, router]
  );

  if (isLoaded && auth.user) return redirect("/");
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Account Recovery</h1>
          <p className="mt-2 text-gray-600">Recover access to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 font-medium text-sm ${
              recoveryMethod === "email"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setRecoveryMethod("email")}
          >
            Email
          </button>
          <button
            className={`flex-1 py-2 font-medium text-sm ${
              recoveryMethod === "username"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setRecoveryMethod("username")}
          >
            Username & Tag
          </button>
        </div>

        <form onSubmit={handleRecovery} className="mt-6 space-y-6">
          {recoveryMethod === "email" ? (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                ref={emailRef}
                autoComplete="username webauthn"
                placeholder="your.email@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  ref={usernameRef}
                  autoComplete="username webauthn"
                  placeholder="Username"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="tag"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tag
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">#</span>
                  </div>
                  <input
                    id="tag"
                    name="tag"
                    type="number"
                    required
                    ref={tagRef}
                    min={0}
                    max={9999}
                    autoComplete="off"
                    placeholder="0000"
                    className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                "Recover Account"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Link
              href="/login"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Login
            </Link>
          </div>
        </div>

        <div className="text-sm text-center mt-6">
          <p className="text-gray-600">
            Need help?{" "}
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function A() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RecoverAccount />
    </Suspense>
  );
}
