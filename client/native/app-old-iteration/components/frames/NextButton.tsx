import clsx from "clsx";
import { Text, View } from "react-native";
import { TouchableOpacity, TouchableOpacityProps } from 'react-native-gesture-handler'

export default function NextButton({ className, onPress, ...rest }: TouchableOpacityProps) {
    return <TouchableOpacity activeOpacity={.75} onPress={onPress} {...rest}>
        <View className={clsx("bg-bg-ultraslim px-4 py-2 rounded-full align-middle", className)}>
            <Text className="text-text-primary font-inter-bold text-2xl">Next</Text>
        </View>
    </TouchableOpacity>
}