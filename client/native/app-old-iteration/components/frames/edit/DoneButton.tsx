import React, {  } from 'react'
import { Text } from 'react-native';
import { View } from 'react-native';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native-gesture-handler';
import clsx from 'clsx';

interface DoneButtonProps extends TouchableOpacityProps {
    hidden: boolean
}

export default function DoneButton({ hidden, disabled, onPress, ...rest }: DoneButtonProps) {
    return (
        <View className={clsx(hidden && 'hidden', 'absolute bottom-10 inset-x-6 z-10')} >
            <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={.85} {...rest}>
                <View className={clsx(disabled ? "bg-text-third" : "bg-text-primary", 'rounded px-6 py-5')}>
                    <Text className='text-text-inverted font-inter-semibold text-center'>Done</Text>
                </View>
            </TouchableOpacity>
        </View>
    )
}