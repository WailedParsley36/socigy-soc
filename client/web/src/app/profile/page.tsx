"use client";

import { useState, useEffect } from "react";
import { ProfileHelper } from "@/lib/api/ProfileHelper";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect } from "next/navigation";
import protectRoute from "@/lib/protectRoute";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import DevicesPanel from "@/components/profile/DevicesPanel";
import SecurityPanel from "@/components/profile/SecurityPanel";
import MFAPanel from "@/components/profile/MFAPanel";
import Notification from "@/components/profile/Notification";
import LoadingScreen from "@/components/LoadingScreen";
import EditDeviceModal from "@/components/profile/modals/EditDeviceModal";
import MFASetupModal from "@/components/profile/modals/MFASetupModal";

export default function ProfilePage() {
  const { isLoaded, auth } = useAwaitedAuthStore();

  // States
  const [activeTab, setActiveTab] = useState<any>(0);
  const [isLoading, setIsLoading] = useState<any>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>({
    profile: null,
    devices: [],
    loginAttempts: [],
    securityLogs: [],
    mfaSettings: [],
  });

  // Modal states
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedMFAType, setSelectedMFAType] = useState(null);

  // Load data
  useEffect(() => {
    if (isLoaded) {
      fetchProfileData();
    }
  }, [isLoaded]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        profileResult,
        devicesResult,
        loginAttemptsResult,
        securityLogsResult,
        mfaSettingsResult,
      ] = await Promise.all([
        ProfileHelper.getUserProfile(),
        ProfileHelper.listDevices(),
        ProfileHelper.listLoginAttempts(),
        ProfileHelper.listSecurityEvents(),
        ProfileHelper.listMFASettings(),
      ]);

      setProfileData({
        profile: profileResult.error ? null : profileResult.result,
        devices: devicesResult.error ? [] : devicesResult.result,
        loginAttempts: loginAttemptsResult.error
          ? []
          : loginAttemptsResult.result,
        securityLogs: securityLogsResult.error ? [] : securityLogsResult.result,
        mfaSettings: mfaSettingsResult.error ? [] : mfaSettingsResult.result,
      });

      if (
        profileResult.error ||
        devicesResult.error ||
        loginAttemptsResult.error ||
        securityLogsResult.error ||
        mfaSettingsResult.error
      ) {
        setError("Some data couldn't be loaded. Please refresh to try again.");
      }
    } catch (err) {
      setError("Failed to load profile data. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Device management
  const handleEditDevice = async (
    deviceId,
    deviceName,
    isTrusted,
    isBlocked
  ) => {
    try {
      const result = await ProfileHelper.editDevice(
        deviceId,
        deviceName,
        isTrusted,
        isBlocked
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess("Device updated successfully");
        setShowEditDeviceModal(false);

        // Refresh devices
        const devicesResult = await ProfileHelper.listDevices();
        if (devicesResult.result) {
          setProfileData((prev) => ({
            ...prev,
            devices: devicesResult.result,
          }));
        }

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Failed to update device. Please try again.");
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      const result = await ProfileHelper.removeDevice(deviceId);

      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess("Device removed successfully");
        setProfileData((prev) => ({
          ...prev,
          devices: prev.devices.filter((device) => device.id !== deviceId),
        }));

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Failed to remove device. Please try again.");
    }
  };

  // MFA management
  const handleMFAOperation = async (operation, type, isDefault = false) => {
    try {
      let result;

      switch (operation) {
        case "enable":
          result = await ProfileHelper.enableMFA(type);
          break;
        case "setDefault":
          result = await ProfileHelper.editMFA(type, isDefault);
          break;
        case "remove":
          result = await ProfileHelper.removeMFA(type);
          break;
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess(
          `MFA ${
            operation === "enable"
              ? "enabled"
              : operation === "setDefault"
              ? "set as default"
              : "removed"
          } successfully`
        );
        setShowMFAModal(false);

        // Refresh MFA settings
        const mfaResult = await ProfileHelper.listMFASettings();
        if (mfaResult.result) {
          setProfileData((prev) => ({
            ...prev,
            mfaSettings: mfaResult.result,
          }));
        }

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(`Failed to ${operation} MFA. Please try again.`);
    }
  };

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Notifications */}
      {success && (
        <Notification
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader
          profile={profileData.profile}
          user={auth.user}
          onProfileUpdate={(updatedProfile) => {
            setProfileData((prev) => ({
              ...prev,
              profile: { ...prev.profile, ...updatedProfile },
            }));
            setSuccess("Profile updated successfully");
            setTimeout(() => setSuccess(null), 3000);
          }}
        />

        {/* Main Content */}
        <div className="mt-8">
          <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-4">
            {activeTab === 0 && (
              <DevicesPanel
                devices={profileData.devices}
                onEditDevice={(device) => {
                  setSelectedDevice(device);
                  setShowEditDeviceModal(true);
                }}
                onRemoveDevice={handleRemoveDevice}
                isLoading={isLoading}
              />
            )}

            {activeTab === 1 && (
              <SecurityPanel
                loginAttempts={profileData.loginAttempts}
                securityLogs={profileData.securityLogs}
                onLoadMoreLoginAttempts={async () => {
                  const result = await ProfileHelper.listLoginAttempts(
                    10,
                    profileData.loginAttempts.length
                  );
                  if (result.result) {
                    setProfileData((prev) => ({
                      ...prev,
                      loginAttempts: [...prev.loginAttempts, ...result.result],
                    }));
                  }
                }}
                onLoadMoreSecurityLogs={async () => {
                  const result = await ProfileHelper.listSecurityEvents(
                    10,
                    profileData.securityLogs.length
                  );
                  if (result.result) {
                    setProfileData((prev) => ({
                      ...prev,
                      securityLogs: [...prev.securityLogs, ...result.result],
                    }));
                  }
                }}
                isLoading={isLoading}
              />
            )}

            {activeTab === 2 && (
              <MFAPanel
                mfaSettings={profileData.mfaSettings}
                onEnableMFA={(type) => {
                  setSelectedMFAType(type);
                  setShowMFAModal(true);
                }}
                onSetDefaultMFA={(type) =>
                  handleMFAOperation("setDefault", type, true)
                }
                onRemoveMFA={(type) => handleMFAOperation("remove", type)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditDeviceModal && selectedDevice && (
        <EditDeviceModal
          device={selectedDevice}
          onClose={() => setShowEditDeviceModal(false)}
          onSave={handleEditDevice}
        />
      )}

      {showMFAModal && selectedMFAType !== null && (
        <MFASetupModal
          mfaType={selectedMFAType}
          onClose={() => setShowMFAModal(false)}
          onEnable={() => handleMFAOperation("enable", selectedMFAType)}
        />
      )}
    </div>
  );
}
