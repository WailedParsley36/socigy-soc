import { useTabBarVisibility } from "@/contexts/TabBarVisibilityContext";
import { Stack, useNavigation } from "expo-router";
import { useEffect } from "react";

export default function Layout() {
  const navigation = useNavigation();
  const { hide, show } = useTabBarVisibility();

  useEffect(() => {
    function onBlur() {
      show();
    }

    function beforeRemove() {
      show();
    }

    hide();
    navigation.addListener("blur", onBlur);
    navigation.addListener("beforeRemove", beforeRemove);
    return () => {
      navigation.removeListener("blur", onBlur);
      navigation.removeListener("beforeRemove", beforeRemove);
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{}} />
      <Stack.Screen name="permissions" options={{}} />
    </Stack>
  );
}
