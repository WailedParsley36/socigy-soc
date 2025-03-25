"use client";

import { Suspense } from "react";
import { useAuthStore } from "@/stores/AuthStore";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useRef, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";

export function EmailMfaPage() {
  const params = useSearchParams();
  const auth = useAuthStore();
  const router = useRouter();

  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const trustRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(undefined);
      setIsSubmitting(true);

      try {
        const result = await auth.submitEmailMfa(
          codeRef.current!.value,
          trustRef.current?.checked ?? false
        );
        if (result.error) {
          setError(result.error.message);
        } else {
          router.replace(params.get("redirectUrl") ?? "/");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, auth, params]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the code sent to your email
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-code" className="sr-only">
                Email Code
              </label>
              <input
                id="email-code"
                name="code"
                type="text"
                required
                ref={codeRef}
                minLength={6}
                maxLength={6}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter 6-digit code"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="trust-device"
              name="trust"
              type="checkbox"
              ref={trustRef}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="trust-device"
              className="ml-2 block text-sm text-gray-900"
            >
              Trust this device
            </label>
          </div>

          {status && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{status}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Resend Code
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSubmitting ? (
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
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function A() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <EmailMfaPage />
    </Suspense>
  );
}
