import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MFAType } from "@/lib/api/ProfileHelper";

interface MFASetupModalProps {
  mfaType: MFAType;
  visible: boolean;
  onClose: () => void;
  onEnable: (type: MFAType, code?: string) => void;
}

export default function MFASetupModal({
  mfaType,
  visible,
  onClose,
  onEnable,
}: MFASetupModalProps) {
  const [verificationCode, setVerificationCode] = useState("");

  const handleCodeChange = (text: string) => {
    setVerificationCode(text.replace(/\D/g, "").substring(0, 6));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] m-4">
          <Text className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {mfaType === MFAType.Authenticator
              ? "Set Up Authenticator App"
              : "Set Up Email Authentication"}
          </Text>

          <ScrollView>
            {mfaType === MFAType.Authenticator ? (
              <View className="mb-6">
                <Text className="text-gray-600 dark:text-gray-300 mb-4">
                  Scan the QR code below with your authenticator app (like
                  Google Authenticator, Authy, or Microsoft Authenticator).
                </Text>

                <View className="bg-white dark:bg-gray-700 p-4 rounded-lg items-center mb-4">
                  <View className="w-48 h-48 bg-gray-200 dark:bg-gray-600 items-center justify-center">
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      QR Code Placeholder
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  If you can't scan the QR code, you can manually enter this
                  code in your app:
                </Text>

                <View className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
                  <Text className="text-indigo-800 dark:text-indigo-300 font-mono text-center">
                    ABCD EFGH IJKL MNOP
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter the 6-digit code from your app
                  </Text>
                  <TextInput
                    value={verificationCode}
                    onChangeText={handleCodeChange}
                    placeholder="000000"
                    keyboardType="numeric"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-center text-lg tracking-widest"
                  />
                </View>

                <View className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
                  <View className="flex-row items-start">
                    <Ionicons name="warning" size={20} color="#f59e0b" />
                    <Text className="ml-3 text-sm text-yellow-700 dark:text-yellow-300 flex-1">
                      Save these backup codes in a secure place. You can use
                      them to sign in if you lose access to your authenticator
                      app.
                    </Text>
                  </View>
                </View>

                <View className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4 flex-row flex-wrap">
                  {[
                    "ABCD-1234-EFGH",
                    "IJKL-5678-MNOP",
                    "QRST-9012-UVWX",
                    "YZ12-3456-7890",
                  ].map((code, i) => (
                    <View key={i} className="w-1/2 p-1">
                      <Text className="text-center font-mono text-sm text-gray-700 dark:text-gray-300">
                        {code}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <Text className="text-gray-600 dark:text-gray-300 mb-4">
                  We've sent a verification code to your email address. Please
                  enter it below to enable email authentication.
                </Text>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter the 6-digit code from your email
                  </Text>
                  <TextInput
                    value={verificationCode}
                    onChangeText={handleCodeChange}
                    placeholder="000000"
                    keyboardType="numeric"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-center text-lg tracking-widest"
                  />
                </View>
              </View>
            )}

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <Text className="text-gray-700 dark:text-gray-300">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onEnable(mfaType, verificationCode)}
                disabled={verificationCode.length !== 6}
                className={`px-4 py-2 bg-indigo-800 rounded-md ${
                  verificationCode.length !== 6 ? "opacity-50" : ""
                }`}
              >
                <Text className="text-white">Verify and Enable</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
