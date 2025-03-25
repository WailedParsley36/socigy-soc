import clsx from "clsx"
import { View, ViewProps } from "react-native"

interface FillingViewProps extends ViewProps {
    hidden?: boolean
}
export default function FillingView({ className, children, hidden, ...rest }: FillingViewProps) {
    return <View className={clsx(hidden && 'hidden', className, "flex-1")} {...rest}>
        {children}
    </View>
}