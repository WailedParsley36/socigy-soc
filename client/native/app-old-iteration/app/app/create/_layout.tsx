import { useTabBarVisibility } from "@/contexts/TabBarVisibilityContext";
import { StackActions } from "@react-navigation/native";
import { router, Stack, useNavigation } from "expo-router";
import { useEffect } from "react";

export function useLayoutReset() {
    const navigation = useNavigation();

    useEffect(() => {
        function onBlur() {
            const state = navigation.getState();
            if (state && state.routes.findIndex(x => x.name == "index") < 0)
                navigation.dispatch(StackActions.push("index"))
            else
                navigation.dispatch(StackActions.popToTop())
        }

        navigation.addListener('blur', onBlur)
        return () => navigation.removeListener('blur', onBlur);
    }, [])

    return navigation;
}

export default function CreateLayout() {
    return <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="audio" />
        <Stack.Screen name="frames" />
        <Stack.Screen name="text" />
        <Stack.Screen name="video" />
    </Stack>
}