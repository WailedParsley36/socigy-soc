import React, { useState } from "react";
import { Pressable, Text } from "react-native";
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
      <Pressable
        onPress={() => setShowInstallModal(true)}
        className={`${sizeClasses[size]} rounded-lg ${
          plugin.paymentType === PaymentType.Free
            ? "bg-blue-600 active:bg-blue-700"
            : "bg-green-600 active:bg-green-700"
        }`}
      >
        <Text className="font-medium text-white text-center">
          {plugin.paymentType === PaymentType.Free
            ? "Install"
            : `Buy $${plugin.price?.toFixed(2)}`}
        </Text>
      </Pressable>

      <InstallModal
        plugin={plugin}
        visible={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
