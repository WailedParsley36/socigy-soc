import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

export default function useKeyboardVisibility() {
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(Keyboard.isVisible());
    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true)
        })
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false)
        })

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        }
    }, [])
    return keyboardVisible;
}