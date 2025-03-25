// components/profile/DevicesPanel.tsx
import React from "react";
import { format } from "date-fns";
import { Device, DeviceType } from "@/lib/api/ProfileHelper";

interface DevicesPanelProps {
  devices: Device[];
  onEditDevice: (device: Device) => void;
  onRemoveDevice: (deviceId: number) => void;
  isLoading: boolean;
}

export default function DevicesPanel({
  devices,
  onEditDevice,
  onRemoveDevice,
  isLoading,
}: DevicesPanelProps) {
  const getDeviceTypeName = (type: DeviceType) => {
    switch (type) {
      case DeviceType.Desktop:
        return "Desktop";
      case DeviceType.Mobile:
        return "Mobile";
      case DeviceType.Tablet:
        return "Tablet";
      case DeviceType.Other:
        return "Other";
      default:
        return "Unknown";
    }
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case DeviceType.Desktop:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case DeviceType.Mobile:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
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
        );
      case DeviceType.Tablet:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Your Devices
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        These are the devices that have logged into your account. You can
        rename, trust, or block devices for enhanced security.
      </p>

      {devices.length === 0 ? (
        <div className="text-center py-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            No devices found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                device.isBlocked
                  ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                  : device.isCurrent
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-gray-700 dark:border-gray-600"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="mr-4 text-gray-500 dark:text-gray-400">
                    {getDeviceIcon(device.deviceType)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {device.deviceName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {getDeviceTypeName(device.deviceType)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {device.isCurrent && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                          Current Device
                        </span>
                      )}
                      {device.isTrusted && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                          Trusted
                        </span>
                      )}
                      {device.isBlocked && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-2 py-0.5 rounded-full">
                          Blocked
                        </span>
                      )}
                      {device.isNew && (
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {device.lastUsedAt
                        ? `Last used: ${format(
                            new Date(device.lastUsedAt),
                            "MMM d, yyyy h:mm a"
                          )}`
                        : `Created: ${format(
                            new Date(device.createdAt || new Date()),
                            "MMM d, yyyy"
                          )}`}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditDevice(device)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    Edit
                  </button>
                  {!device.isCurrent && (
                    <button
                      onClick={() => onRemoveDevice(device.id)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
