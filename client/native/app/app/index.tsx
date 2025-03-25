import { Alert, Button, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import { Colors, Theme } from "@/constants/Colors";
import * as SystemUI from "expo-system-ui";
import { apiFetch } from "@/lib/apiClient";
import useAwaitedAuthStore from "@/stores/AuthStore";
import protectRoute from "@/lib/protectRoute";
import { Link, Redirect, useNavigation } from "expo-router";
import LoadingScreen from "@/components/LoadingScreen";
import { signInAsync } from "expo-passkeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";

SystemUI.setBackgroundColorAsync(Colors[Theme].background);
const userAgent = `Mozilla/5.0 (${Platform.OS}; ${Device.osName || "Unknown"} ${
  Device.osVersion || "Unknown"
}; ${Device.manufacturer} ${Device.modelName} Build/${
  Device.osBuildId
}) Socigy/1.0.0 (KHTML, like Gecko)`;

export default function Index() {
  const [response, setResponse] = useState<string>();
  const { isLoaded, auth } = useAwaitedAuthStore();

  const [loaded, setLoaded] = useState<string>();
  useEffect(() => {
    async function load() {
      setLoaded((await AsyncStorage.getItem("test")) ?? "NOTHING");
    }
    load();
  }, []);

  if (!isLoaded) return <LoadingScreen />;
  if (auth.isAuthenticated()) return <Redirect href={"/app"} />;
  else return <Redirect href={"/(auth)/login"} />;
}
