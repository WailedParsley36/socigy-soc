import clsx from "clsx";
import { ScrollViewProps, View, ViewProps } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
    children?: any,
    className?: string,
    additionalViewProps?: ViewProps,

    scrollViewClassName?: string,
    additionalScrollViewProps?: ScrollViewProps,
    isSafe?: boolean
    canScroll?: boolean
}

export default function AppBackgroundBase({ children, className, canScroll, scrollViewClassName, additionalScrollViewProps, additionalViewProps, isSafe = true }: Props) {
    // const { contentContainerStyle } = additionalScrollViewProps ?? {
    //     contentContainerStyle: { paddingBottom: 85 }
    // };

    return <View className="bg-bg-default flex-1 w-full h-full">
        {isSafe ?
            <SafeAreaView className={clsx("flex-1 w-full", className)} {...additionalViewProps}>
                {canScroll ?
                    <ScrollView className={scrollViewClassName} {...additionalScrollViewProps}>
                        {children}
                    </ScrollView>
                    :
                    children
                }
            </SafeAreaView>
            :
            (
                canScroll ?
                    <ScrollView className={scrollViewClassName} {...additionalScrollViewProps}>
                        {children}
                    </ScrollView>
                    :
                    children
            )
        }
    </View>
}