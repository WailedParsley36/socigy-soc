import { useState } from "react";

import {
  CreatePluginRequest,
  PaymentType,
  PlatformType,
  PluginAPI,
  PluginRecommendation,
  PublishStatus,
  VerificationStatus,
} from "@/lib/api/PluginAPI";
import { useToast } from "@/contexts/ToastContext";

interface PluginDetailsFormProps {
  plugin: PluginRecommendation;
  onUpdateSuccess: (plugin: PluginRecommendation) => void;
}

export default function PluginDetailsForm({
  plugin,
  onUpdateSuccess,
}: PluginDetailsFormProps) {
  const [title, setTitle] = useState(plugin.title);
  const [description, setDescription] = useState(plugin.description || "");
  const [paymentType, setPaymentType] = useState<PaymentType>(
    plugin.paymentType
  );
  const [price, setPrice] = useState<number | undefined>(plugin.price);
  const [platforms, setPlatforms] = useState<PlatformType>(plugin.platforms);
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(
    plugin.iconUrl || null
  );
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
      const pluginData: Partial<CreatePluginRequest> = {
        title,
        description: description || undefined,
        paymentType,
        price: paymentType === PaymentType.OneTime ? price : undefined,
        platforms,
        icon: icon || undefined,
      };

      await PluginAPI.editPlugin(plugin.plugin_id, pluginData);

      // Refresh plugin details
      const updatedPluginResponse = await PluginAPI.getPluginDetails(
        plugin.plugin_id
      );
      if (updatedPluginResponse.result) {
        onUpdateSuccess(updatedPluginResponse.result);
      }

      showToast({
        title: "Success",
        description: "Plugin details updated successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to update plugin:", error);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Basic Information
          </h3>

          <div className="space-y-4">
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
                rows={4}
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
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Platform & Media
          </h3>

          <div className="space-y-4">
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
                Plugin Icon
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="flex-shrink-0 h-24 w-24 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Icon Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-400"
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
                    {iconPreview ? "Change Icon" : "Upload Icon"}
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, or GIF. Recommended size 512x512px.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Plugin Status
              </label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plugin.publishStatus === PublishStatus.Published
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : plugin.publishStatus === PublishStatus.Reviewing
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : plugin.publishStatus === PublishStatus.Preparing
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {plugin.publishStatus === PublishStatus.Published
                      ? "Published"
                      : plugin.publishStatus === PublishStatus.Reviewing
                      ? "Under Review"
                      : plugin.publishStatus === PublishStatus.Preparing
                      ? "Draft"
                      : "Taken Down"}
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plugin.verificationStatus === VerificationStatus.Verified
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : plugin.verificationStatus ===
                          VerificationStatus.Pending
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : plugin.verificationStatus ===
                          VerificationStatus.Unverified
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {plugin.verificationStatus === VerificationStatus.Verified
                      ? "Verified"
                      : plugin.verificationStatus === VerificationStatus.Pending
                      ? "Verification Pending"
                      : plugin.verificationStatus ===
                        VerificationStatus.Unverified
                      ? "Unverified"
                      : "Marked as Malicious"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
