"use client";

import { Suspense } from "react";
import RegisterForm from "@/components/forms/RegisterForm";
import LoadingScreen from "@/components/LoadingScreen";
import { Guid } from "@/lib/structures/Guid";
import useAwaitedAuthStore from "@/stores/AuthStore";
import Link from "next/link";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function RegisterPage() {
  const params = useSearchParams();
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const handleBasicRegistrationSuccess = useCallback(
    (userId: Guid) => {
      router.replace("/mfa/email?redirectUrl=/register/step-1");
    },
    [router]
  );

  if (isLoaded && auth.user) return redirect("/");
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join our community today</p>
        </div>

        <RegisterForm onSuccess={handleBasicRegistrationSuccess} />

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Link
              href={`/login?redirectUrl=${params.get("redirectUrl") ?? "/"}`}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RegisterPage />
    </Suspense>
  );
}
