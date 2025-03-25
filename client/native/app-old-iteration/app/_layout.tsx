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
import AppContexts from "@/constants/ContextProviders";
import * as Device from "expo-device";
import AppInfo from "@/constants/AppInfo";
import { useAppState, useAuth } from "@/managers/Exports";
import { AppState } from "@/managers/BaseManager";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();
registerUserAgentFetch();

export default function RootLayout() {
  const auth = useAuth();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const [notLoading, setNotLoading] = useState<boolean>(false);

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
    auth.manager.setRootState = setNotLoading;
  }, []);

  useEffect(() => {
    async function splash() {
      await SplashScreen.hideAsync();
    }

    if (auth.state == AppState.NotRegistered) {
      router.replace("/auth/(registration)/register-step-1");
    } else if (auth.state == AppState.MFA) {
      router.replace("/auth/mfa-verification?redirectTo=/app");
    } else if (auth.state == AppState.Authorized) {
      navigation.reset({
        index: 0,
        routes: [{ name: "app" as never }],
      });
    }

    setTimeout(splash, 750);
  }, [auth, notLoading, fontsLoaded]);

  return (
    <AppContexts>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar translucent={true} />
        <Stack
          screenOptions={{
            headerShown: false,
            animationDuration: 1000,
            presentation: "modal",
          }}
        >
          <Stack.Screen
            name="index"
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="auth/index"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/register"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/(registration)/register-step-1"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/(registration)/register-step-2"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/(registration)/register-step-3"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/(registration)/register-step-4"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/(registration)/register-step-5"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/(registration)/register-step-child"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </GestureHandlerRootView>
    </AppContexts>
  );
}

function registerUserAgentFetch() {
  const userAgent = `Mozilla/5.0 (${Platform.OS}; ${
    Device.osName || "Unknown"
  } ${Device.osVersion || "Unknown"}; ${Device.manufacturer} ${
    Device.modelName
  } Build/${Device.osBuildId}) Socigy/${AppInfo.appVersion.substring(
    1
  )} (KHTML, like Gecko)`;

  async function fetchWithUserAgent(
    input: string | URL | Request,
    init?: RequestInit
  ) {
    return await global.defaultFetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        "User-Agent": userAgent,
      },
    });
  }

  if (Platform.OS != "web" && !global.defaultFetch) {
    global.defaultFetch = global.fetch;
    global.fetch = fetchWithUserAgent;
  }
}
