// components/profile/MFAPanel.tsx
import React from "react";
import { MFASettings, MFAType } from "@/lib/api/ProfileHelper";

interface MFAPanelProps {
  mfaSettings: MFASettings[];
  onEnableMFA: (type: MFAType) => void;
  onSetDefaultMFA: (type: MFAType) => void;
  onRemoveMFA: (type: MFAType) => void;
  isLoading: boolean;
}

export default function MFAPanel({
  mfaSettings,
  onEnableMFA,
  onSetDefaultMFA,
  onRemoveMFA,
  isLoading,
}: MFAPanelProps) {
  const getMFATypeName = (type: MFAType) => {
    switch (type) {
      case MFAType.Email:
        return "Email";
      case MFAType.Authenticator:
        return "Authenticator App";
      case MFAType.PhoneNumber:
        return "Phone Number";
      case MFAType.Application:
        return "Application";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Multi-Factor Authentication
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Secure your account with multiple authentication methods. We recommend
        enabling at least one MFA method for enhanced security.
      </p>

      <div className="space-y-4">
        {/* Email MFA */}
        <div className="border dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Email Authentication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Receive a verification code via email when logging in from a
                  new device.
                </p>
                {mfaSettings.find((m) => m.type === MFAType.Email)
                  ?.isDefault && (
                  <span className="inline-block mt-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                    Default Method
                  </span>
                )}
              </div>
            </div>
            <div>
              {mfaSettings.find((m) => m.type === MFAType.Email)?.isEnabled ? (
                <div className="flex space-x-2">
                  {!mfaSettings.find((m) => m.type === MFAType.Email)
                    ?.isDefault && (
                    <button
                      onClick={() => onSetDefaultMFA(MFAType.Email)}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  {!mfaSettings.find((m) => m.type === MFAType.Email)
                    ?.isDefault && (
                    <button
                      onClick={() => onRemoveMFA(MFAType.Email)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onEnableMFA(MFAType.Email)}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Authenticator App MFA */}
        <div className="border dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Authenticator App
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Use an authenticator app like Google Authenticator or Authy to
                  generate verification codes.
                </p>
                {mfaSettings.find((m) => m.type === MFAType.Authenticator)
                  ?.isDefault && (
                  <span className="inline-block mt-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                    Default Method
                  </span>
                )}
              </div>
            </div>
            <div>
              {mfaSettings.find((m) => m.type === MFAType.Authenticator)
                ?.isEnabled ? (
                <div className="flex space-x-2">
                  {!mfaSettings.find((m) => m.type === MFAType.Authenticator)
                    ?.isDefault && (
                    <button
                      onClick={() => onSetDefaultMFA(MFAType.Authenticator)}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  {!mfaSettings.find((m) => m.type === MFAType.Authenticator)
                    ?.isDefault && (
                    <button
                      onClick={() => onRemoveMFA(MFAType.Authenticator)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onEnableMFA(MFAType.Authenticator)}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phone Number MFA */}
      <div className="border dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Phone Number
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Receive a verification code via SMS when logging in from a new
                device.
              </p>
              <span className="inline-block mt-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
          <div>
            <button
              disabled
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded cursor-not-allowed"
            >
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
