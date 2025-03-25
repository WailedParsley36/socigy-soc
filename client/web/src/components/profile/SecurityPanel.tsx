import React from "react";
import { format } from "date-fns";
import {
  LoginAttempt,
  SecurityLog,
  SecurityEventType,
} from "@/lib/api/ProfileHelper";

interface SecurityPanelProps {
  loginAttempts: LoginAttempt[];
  securityLogs: SecurityLog[];
  onLoadMoreLoginAttempts: () => void;
  onLoadMoreSecurityLogs: () => void;
  isLoading: boolean;
}

export default function SecurityPanel({
  loginAttempts,
  securityLogs,
  onLoadMoreLoginAttempts,
  onLoadMoreSecurityLogs,
  isLoading,
}: SecurityPanelProps) {
  const getSecurityEventTypeName = (type: SecurityEventType) => {
    switch (type) {
      case SecurityEventType.LOGIN_SUCCESS:
        return "Login Success";
      case SecurityEventType.LOGIN_FAILURE:
        return "Login Failure";
      case SecurityEventType.PASSWORD_CHANGE:
        return "Password Change";
      case SecurityEventType.EMAIL_CHANGE:
        return "Email Change";
      case SecurityEventType.MFA_ENABLED:
        return "MFA Enabled";
      case SecurityEventType.MFA_DISABLED:
        return "MFA Disabled";
      case SecurityEventType.DEVICE_TRUSTED:
        return "Device Trusted";
      case SecurityEventType.DEVICE_BLOCKED:
        return "Device Blocked";
      case SecurityEventType.MFA_REMOVED:
        return "MFA Removed";
      default:
        return "Unknown";
    }
  };

  const getSecurityEventIcon = (type: SecurityEventType) => {
    switch (type) {
      case SecurityEventType.LOGIN_SUCCESS:
        return (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-600 dark:text-green-400"
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
        );
      case SecurityEventType.LOGIN_FAILURE:
        return (
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-600 dark:text-red-400"
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
        );
      case SecurityEventType.PASSWORD_CHANGE:
      case SecurityEventType.EMAIL_CHANGE:
        return (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        );
      case SecurityEventType.MFA_ENABLED:
      case SecurityEventType.MFA_DISABLED:
      case SecurityEventType.MFA_REMOVED:
        return (
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-purple-600 dark:text-purple-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case SecurityEventType.DEVICE_TRUSTED:
      case SecurityEventType.DEVICE_BLOCKED:
        return (
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Security Activity
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Recent security events and login attempts for your account.
      </p>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
          Login History
        </h3>
        <div className="space-y-4">
          {loginAttempts.map((attempt, index) => (
            <div
              key={index}
              className="flex items-start border-b dark:border-gray-700 pb-4"
            >
              <div className="mr-4">
                {attempt.success
                  ? getSecurityEventIcon(SecurityEventType.LOGIN_SUCCESS)
                  : getSecurityEventIcon(SecurityEventType.LOGIN_FAILURE)}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-gray-900 dark:text-white">
                  {attempt.success
                    ? "Successful Login"
                    : "Failed Login Attempt"}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <p>IP Address: {attempt.ipAddress}</p>
                  <p>
                    Device:{" "}
                    {attempt.deviceId
                      ? `Device #${attempt.deviceId}`
                      : "Unknown Device"}
                  </p>
                  <p>
                    Browser:{" "}
                    {attempt.userAgent
                      ? attempt.userAgent.split(" ")[0]
                      : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                {attempt.attemptAt
                  ? format(new Date(attempt.attemptAt), "MMM d, yyyy h:mm a")
                  : "Unknown date"}
              </div>
            </div>
          ))}
        </div>

        {loginAttempts.length > 0 && (
          <button
            onClick={onLoadMoreLoginAttempts}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            Load More
          </button>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
          Security Events
        </h3>
        <div className="space-y-4">
          {securityLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start border-b dark:border-gray-700 pb-4"
            >
              <div className="mr-4">{getSecurityEventIcon(log.eventType)}</div>
              <div className="flex-grow">
                <p className="font-medium text-gray-900 dark:text-white">
                  {" "}
                  {getSecurityEventTypeName(log.eventType)}{" "}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {" "}
                  {log.details}{" "}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <p>IP Address: {log.ipAddress}</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                {" "}
                {format(new Date(log.eventAt), "MMM d, yyyy h:mm a")}{" "}
              </div>
            </div>
          ))}
        </div>
        {securityLogs.length > 0 && (
          <button
            // onClick={loadMoreSecurityLogs}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
