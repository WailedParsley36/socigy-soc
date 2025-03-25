import React, {  } from 'react'
import { View } from 'react-native';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native-gesture-handler';
import clsx from 'clsx';

interface EditButtonProps extends TouchableOpacityProps {
    hidden?: boolean
}

export default function EditButton({ className, hidden, children, ...rest }: EditButtonProps) {
    return (
        <TouchableOpacity activeOpacity={.85} {...rest}>
            <View className={clsx(hidden && "hidden", className, 'p-3.5 rounded-full bg-bg-ultraslim/80 flex items-center justify-center')}>
                {children}
            </View>
        </TouchableOpacity>
    )
}