import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

export function useDimensions(name: 'window' | 'screen') {
    const [dimensions, setDimensions] = useState(Dimensions.get(name));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
            if (name == 'screen')
                setDimensions(screen)
            else
                setDimensions(window)
        })

        return () => {
            subscription.remove();
        }
    }, [])

    return dimensions
}