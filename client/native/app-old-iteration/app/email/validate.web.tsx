import AppBackgroundBase from "@/components/background/AppBackgroundBase";
import { useAuthManager } from "@/managers/Exports";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Button, Text } from 'react-native'
import NotFound from "../+not-found";

function base64UrlToString(base64Url: string) {
    // Step 1: Replace Base64Url characters with Base64 characters
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Step 2: Add padding if necessary
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }

    // Step 3: Decode the Base64 string
    try {
        return atob(base64); // Decodes Base64 to a regular string
    } catch (e) {
        console.error("Invalid Base64Url string:", e);
        return "";
    }
}

export default function ValidateEmail() {
    const { email, code, type } = useLocalSearchParams();
    const authManager = useAuthManager();

    useEffect(() => {
        if (!email || !code || type != "email")
            return;

        authManager.verifyEmailWithCode(base64UrlToString(code as string), false, base64UrlToString(email as string));
    }, [])

    if (!email || !code || type != "email")
        return <NotFound />

    return <AppBackgroundBase className="flex flex-1 justify-center items-center">
        <Text className="text-foreground text-center">Your email has been verified{'\r\n'}You can continue on your device...</Text>
    </AppBackgroundBase>
}