import { StatusBar } from "expo-status-bar";
import {
  Redirect,
  router,
  Slot,
  SplashScreen,
  Stack,
  useNavigation,
  usePathname,
} from "expo-router";
import { useEffect, useState } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import { Text } from "react-native";
import {
  useFonts,
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";

import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors, Theme, ThemeChange } from "@/constants/Colors";
import * as SystemUI from "expo-system-ui";
import * as Device from "expo-device";
import AppInfo from "@/constants/AppInfo";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import StoreInitializerProvider from "@/lib/StoreInitializerProvider";
import useAwaitedAuthStore, {
  AuthContext,
  AuthProvider,
} from "@/stores/AuthStore";
import { ToastProvider } from "@/contexts/ToastContext";
import { UIProvider } from "@/stores/UIRegistryStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!colorScheme) return;

    if (Platform.OS != "web") Appearance.setColorScheme(colorScheme);

    ThemeChange.setTheme(colorScheme!);
  }, [colorScheme]);

  let fontsLoaded = true;
  if (Platform.OS != "web") {
    fontsLoaded = false;
    [fontsLoaded] = useFonts({
      Inter_100Thin,
      Inter_200ExtraLight,
      Inter_300Light,
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
      Inter_800ExtraBold,
      Inter_900Black,
    });
  }

  useEffect(() => {
    async function loadApp() {
      await SystemUI.setBackgroundColorAsync(Colors[Theme]["bg-default"]);
      await SplashScreen.preventAutoHideAsync();
    }

    loadApp();
  }, []);

  useEffect(() => {
    async function splash() {
      await SplashScreen.hideAsync();
    }

    if (!fontsLoaded) return;
    setTimeout(splash, 750);
  }, [fontsLoaded]);

  return (
    <AuthProvider>
      <UIProvider>
        {/* <PluginProvider> */}
        <ToastProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar translucent={true} />
            <Slot />
          </GestureHandlerRootView>
        </ToastProvider>
        {/* </PluginProvider> */}
      </UIProvider>
    </AuthProvider>
  );
}
