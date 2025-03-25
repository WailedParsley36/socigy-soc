import clsx from "clsx";
import { View, Text, ViewProps } from "react-native";

interface HeadingProps extends ViewProps {
    title: string
    description: string,
    className?: string
}

export default function Heading({ title, description, className, ...rest }: HeadingProps) {
    return <View className={clsx("flex justify-center mt-2", className)} {...rest}>
        <Text className="text-text-primary font-inter-extrabold text-4xl mb-4">
            {title}
        </Text>
        <Text className="text-text-third mb-6 font-inter-regular">
            {description}
        </Text>
    </View>
}