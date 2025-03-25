import { Slot, Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="playground" />
      <Stack.Screen name="search" />
      <Stack.Screen name="category/[type]" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
