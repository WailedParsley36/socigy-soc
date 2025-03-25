"use client";

import { ErrorResponse } from "@/lib/structures/ErrorResponse";
import { Guid } from "@/lib/structures/Guid";
import { RegisterUserData, useAuthStore } from "@/stores/AuthStore";
import Link from "next/link";
import { FormEvent, useCallback, useRef, useState } from "react";

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

  const usernameRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);

  const submitRegistrationForm = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(undefined);

      try {
        const data = {
          username: usernameRef.current!.value,
          tag: Number.parseInt(tagRef.current!.value),
          email: emailRef.current!.value,
          fullName: fullNameRef.current!.value,
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
    },
    [onError, onSubmit, onSuccess, register]
  );

  return (
    <form onSubmit={submitRegistrationForm} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            ref={fullNameRef}
            autoComplete="name"
            placeholder="Enter your full name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            ref={emailRef}
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username & Tag
          </label>
          <div className="flex space-x-2">
            <div className="flex-grow">
              <input
                type="text"
                required
                ref={usernameRef}
                autoComplete="username"
                placeholder="Username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-24 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">#</span>
              </div>
              <input
                type="number"
                required
                ref={tagRef}
                min={0}
                max={9999}
                minLength={4}
                maxLength={4}
                autoComplete="off"
                placeholder="0000"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
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
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </div>

      <p className="text-xs text-center text-gray-500 mt-8">
        By registering, you agree to our
        <Link href="/terms" className="text-blue-600 hover:text-blue-500 mx-1">
          Terms of Service
        </Link>
        and
        <Link
          href="/privacy"
          className="text-blue-600 hover:text-blue-500 ml-1"
        >
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
