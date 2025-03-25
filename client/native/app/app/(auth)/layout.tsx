import { Stack } from "expo-router";

export default function llayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationDuration: 1000,
        presentation: "modal",
      }}
    >
      <Stack.Screen name="login" options={{ animation: "simple_push" }} />
      <Stack.Screen name="register" options={{ animation: "simple_push" }} />
      <Stack.Screen
        name="(register)/step-1"
        options={{ animation: "simple_push" }}
      />
      <Stack.Screen
        name="(register)/step-2"
        options={{ animation: "simple_push" }}
      />
      <Stack.Screen
        name="(register)/step-3"
        options={{ animation: "simple_push" }}
      />
      <Stack.Screen
        name="(register)/step-4"
        options={{ animation: "simple_push" }}
      />
      <Stack.Screen
        name="(register)/step-5"
        options={{ animation: "simple_push" }}
      />
      <Stack.Screen name="recover" options={{ animation: "simple_push" }} />
      <Stack.Screen
        name="(mfa)/email"
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}
