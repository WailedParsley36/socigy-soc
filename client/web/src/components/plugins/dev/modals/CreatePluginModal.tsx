import { useToast } from "@/contexts/ToastContext";
import {
  PluginRecommendation,
  PaymentType,
  PlatformType,
  CreatePluginRequest,
  PluginAPI,
} from "@/lib/api/PluginAPI";
import { useState } from "react";

interface CreatePluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plugin: PluginRecommendation) => void;
}

export default function CreatePluginModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePluginModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.Free);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [platforms, setPlatforms] = useState<PlatformType>(PlatformType.All);
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast({
        title: "Validation Error",
        description: "Plugin title is required",
        type: "error",
      });
      return;
    }

    if (!icon) {
      showToast({
        title: "Validation Error",
        description: "Plugin icon is required",
        type: "error",
      });
      return;
    }

    if (paymentType === PaymentType.OneTime && (!price || price <= 0)) {
      showToast({
        title: "Validation Error",
        description: "Price is required for paid plugins",
        type: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      const pluginData: CreatePluginRequest = {
        title,
        description: description || undefined,
        paymentType,
        price: paymentType === PaymentType.OneTime ? price : undefined,
        platforms,
        icon: icon,
      };

      const response = await PluginAPI.createPlugin(pluginData);

      if (response.error) {
        throw new Error(response.error.message || "Failed to create plugin");
      }

      if (response.result) {
        onSuccess(response.result);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create plugin:", error);
      showToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPaymentType(PaymentType.Free);
    setPrice(undefined);
    setPlatforms(PlatformType.All);
    setIcon(null);
    setIconPreview(null);
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIcon(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setIconPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                    id="modal-title"
                  >
                    Create New Plugin
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Plugin Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Payment Type
                      </label>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="free"
                            name="paymentType"
                            checked={paymentType === PaymentType.Free}
                            onChange={() => {
                              setPaymentType(PaymentType.Free);
                              setPrice(undefined);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label
                            htmlFor="free"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Free
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="paid"
                            name="paymentType"
                            checked={paymentType === PaymentType.OneTime}
                            onChange={() => setPaymentType(PaymentType.OneTime)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label
                            htmlFor="paid"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Paid (One-time purchase)
                          </label>
                        </div>
                      </div>
                    </div>

                    {paymentType === PaymentType.OneTime && (
                      <div>
                        <label
                          htmlFor="price"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          id="price"
                          value={price || ""}
                          onChange={(e) => setPrice(parseFloat(e.target.value))}
                          min="0.01"
                          step="0.01"
                          className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Supported Platforms
                      </label>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="web"
                            checked={Boolean(platforms & PlatformType.Web)}
                            onChange={(e) => {
                              setPlatforms(
                                e.target.checked
                                  ? platforms | PlatformType.Web
                                  : platforms & ~PlatformType.Web
                              );
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="web"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Web
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="mobile"
                            checked={Boolean(platforms & PlatformType.Mobile)}
                            onChange={(e) => {
                              setPlatforms(
                                e.target.checked
                                  ? platforms | PlatformType.Mobile
                                  : platforms & ~PlatformType.Mobile
                              );
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="mobile"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Mobile
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="desktop"
                            checked={Boolean(platforms & PlatformType.Desktop)}
                            onChange={(e) => {
                              setPlatforms(
                                e.target.checked
                                  ? platforms | PlatformType.Desktop
                                  : platforms & ~PlatformType.Desktop
                              );
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="desktop"
                            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                          >
                            Desktop
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Plugin Icon *
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        <div className="flex-shrink-0 h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
                          {iconPreview ? (
                            <img
                              src={iconPreview}
                              alt="Icon Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            id="icon"
                            accept="image/*"
                            onChange={handleIconChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="icon"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                          >
                            {icon ? "Change Icon" : "Upload Icon"}
                          </label>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, or GIF. Recommended size 512x512px.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Plugin"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
