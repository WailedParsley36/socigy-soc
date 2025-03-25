import { router, Stack, useNavigation } from "expo-router";
import { useLayoutReset } from "../_layout";
import { useEffect, useRef } from "react";
import { StackActions } from "@react-navigation/native";
import { useTabBarVisibility } from "@/contexts/TabBarVisibilityContext";
import { SelectedImagesContextProvider } from "@/contexts/images/NewSelectedImageContext";

export default function CreateFramesLayout() {
    const navigation = useNavigation();
    const { hide, show } = useTabBarVisibility();

    useEffect(() => {
        function onBlur() {
            navigation.dispatch(StackActions.popToTop())
        }

        function beforeRemove() {
            show();
        }

        hide();
        navigation.addListener('blur', onBlur)
        navigation.addListener('beforeRemove', beforeRemove)
        return () => {
            navigation.removeListener('blur', onBlur);
            navigation.removeListener('beforeRemove', beforeRemove);
        }
    }, [])

    return <SelectedImagesContextProvider>
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="full-frame/index" options={{}} />
            <Stack.Screen name="full-frame/edit" options={{}} />
            <Stack.Screen name="frame" options={{}} />
        </Stack>
    </SelectedImagesContextProvider>
}