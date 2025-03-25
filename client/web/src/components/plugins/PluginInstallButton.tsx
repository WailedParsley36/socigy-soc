// components/plugins/PluginInstallButton.tsx
import { useState } from "react";
import { PluginRecommendation, PaymentType } from "@/lib/api/PluginAPI";
import InstallModal from "./modals/InstallModal";
import { Guid } from "@/lib/structures/Guid";

interface PluginInstallButtonProps {
  plugin: PluginRecommendation;
  size?: "sm" | "md" | "lg";
  onSuccess?: (id: Guid) => void;
}

export default function PluginInstallButton({
  plugin,
  size = "md",
  onSuccess,
}: PluginInstallButtonProps) {
  const [showInstallModal, setShowInstallModal] = useState(false);

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const handleSuccess = (installationId: Guid) => {
    if (onSuccess) {
      onSuccess(installationId);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowInstallModal(true)}
        className={`${
          sizeClasses[size]
        } font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
          plugin.paymentType === PaymentType.Free
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {plugin.paymentType === PaymentType.Free
          ? "Install"
          : `Buy $${plugin.price?.toFixed(2)}`}
      </button>

      <InstallModal
        plugin={plugin}
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
