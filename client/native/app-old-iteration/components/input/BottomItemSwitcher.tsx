import clsx from "clsx"
import { Pressable, View, Text } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

interface SwitcherProps {
    className?: string
    selected: string
    items: string[]
    onItemSelected: (selection: string) => void
}


export default function BottomItemSwitcher({ selected, items, className, onItemSelected }: SwitcherProps) {
    const leftValue = useSharedValue(items.indexOf(selected) * 90)
    const absoluteLeftStyle = useAnimatedStyle(() => ({
        left: leftValue.value
    }))

    const handleItemSelection = (selection: string) => {
        onItemSelected(selection)
        leftValue.value = withSpring(items.indexOf(selection) * 90)
    }

    return <View className={clsx(className, 'absolute bottom-6 inset-x-0 align-middle items-center overflow-hidden')}>
        <View className='flex-row justify-center items-center shadow-lg bg-black rounded-full overflow-hidden'>
            {items.map(x =>
                <Pressable key={x} onPress={() => handleItemSelection(x)} className='z-10 py-3'>
                    <Text className={clsx(selected == x ? "text-text-inverted font-inter-semibold" : "text-text-third", 'px-6')}>{x}</Text>
                </Pressable>
            )}
            <Animated.View className='bg-text-secondary rounded-full absolute inset-y-0' style={[{ width: 90 }, absoluteLeftStyle]} />
        </View>
    </View>
}