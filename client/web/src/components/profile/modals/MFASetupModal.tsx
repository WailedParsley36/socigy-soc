import { useState, useRef } from "react";
import { MFAType } from "@/lib/api/ProfileHelper";

interface MFASetupModalProps {
  mfaType: MFAType;
  onClose: () => void;
  onEnable: (type: MFAType, code?: string) => void;
}

export default function MFASetupModal({
  mfaType,
  onClose,
  onEnable,
}: MFASetupModalProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnable(mfaType, verificationCode);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {mfaType === MFAType.Authenticator
            ? "Set Up Authenticator App"
            : "Set Up Email Authentication"}
        </h2>

        {mfaType === MFAType.Authenticator ? (
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Scan the QR code below with your authenticator app (like Google
              Authenticator, Authy, or Microsoft Authenticator).
            </p>

            <div className="bg-white p-4 rounded-lg flex justify-center mb-4">
              {/* This would be a QR code image from your backend */}
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  QR Code Placeholder
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              If you can't scan the QR code, you can manually enter this code in
              your app:
            </p>

            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center mb-4">
              <code className="text-indigo-800 dark:text-indigo-300 font-mono">
                ABCD EFGH IJKL MNOP
              </code>
            </div>

            <div className="mb-4">
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Enter the 6-digit code from your app
              </label>
              <input
                id="verificationCode"
                type="text"
                ref={codeInputRef}
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").substring(0, 6)
                  )
                }
                maxLength={6}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg tracking-widest"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Save these backup codes in a secure place. You can use them
                    to sign in if you lose access to your authenticator app.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4 grid grid-cols-2 gap-2">
              <div className="text-center font-mono text-sm text-gray-700 dark:text-gray-300">
                ABCD-1234-EFGH
              </div>
              <div className="text-center font-mono text-sm text-gray-700 dark:text-gray-300">
                IJKL-5678-MNOP
              </div>
              <div className="text-center font-mono text-sm text-gray-700 dark:text-gray-300">
                QRST-9012-UVWX
              </div>
              <div className="text-center font-mono text-sm text-gray-700 dark:text-gray-300">
                YZ12-3456-7890
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We've sent a verification code to your email address. Please enter
              it below to enable email authentication.
            </p>

            <div className="mb-4">
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Enter the 6-digit code from your email
              </label>
              <input
                id="verificationCode"
                type="text"
                ref={codeInputRef}
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").substring(0, 6)
                  )
                }
                maxLength={6}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg tracking-widest"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onEnable(mfaType, verificationCode)}
            disabled={verificationCode.length !== 6}
            className="px-4 py-2 bg-indigo-800 text-white rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify and Enable
          </button>
        </div>
      </div>
    </div>
  );
}
