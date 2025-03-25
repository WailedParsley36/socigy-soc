import clsx from "clsx";
import { View, ViewProps } from "react-native";

interface TopAbsoluteRowProps extends ViewProps {
    itemsOverrideClassName?: string
}

export default function TopAbsoluteRow({ itemsOverrideClassName, className, children, ...rest }: TopAbsoluteRowProps) {
    return <View className={clsx(className, "absolute top-12 z-10 pr-8 flex-row w-full", itemsOverrideClassName ?? "justify-between items-center align-middle")} {...rest}>
        {children}
    </View>
}