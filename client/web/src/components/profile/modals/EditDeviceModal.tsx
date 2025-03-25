// components/profile/modals/EditDeviceModal.tsx
import { useRef, useEffect } from "react";
import { Device } from "@/lib/api/ProfileHelper";

interface EditDeviceModalProps {
  device: Device;
  onClose: () => void;
  onSave: (
    deviceId: number,
    deviceName: string,
    isTrusted: boolean,
    isBlocked: boolean
  ) => void;
}

export default function EditDeviceModal({
  device,
  onClose,
  onSave,
}: EditDeviceModalProps) {
  const deviceNameRef = useRef<HTMLInputElement>(null);
  const deviceTrustedRef = useRef<HTMLInputElement>(null);
  const deviceBlockedRef = useRef<HTMLInputElement>(null);

  // Focus the device name input when the modal opens
  useEffect(() => {
    if (deviceNameRef.current) {
      deviceNameRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!deviceNameRef.current) return;

    onSave(
      device.id,
      deviceNameRef.current.value,
      deviceTrustedRef.current?.checked || false,
      deviceBlockedRef.current?.checked || false
    );
  };

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Edit Device
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="deviceName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Device Name
            </label>
            <input
              id="deviceName"
              type="text"
              ref={deviceNameRef}
              defaultValue={device.deviceName}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                ref={deviceTrustedRef}
                defaultChecked={device.isTrusted}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Trust this device
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Trusted devices may bypass certain security checks.
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                ref={deviceBlockedRef}
                defaultChecked={device.isBlocked}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Block this device
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Blocked devices cannot be used to access your account.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-800 text-white rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
