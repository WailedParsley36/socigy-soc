import AppBackgroundBase from '@/components/background/AppBackgroundBase'
import { BackButton } from '@/components/navigation/BackButton'
import clsx from 'clsx'
import { router } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export default function CreateFrames() {
    return (
        <AppBackgroundBase className="justify-center items-center">
            <BackButton fallbackRoute='/app/create' height='40' width='40' />
            <Text className='text-text-primary'>Create Frames</Text>
            <View className='flex flex-row w-full px-16 gap-x-5'>
                <ModeItem y={{ title: "Frames", route: "/app/create/images/frame", icon: undefined }} />
                <ModeItem y={{ title: "Full Frames", route: "/app/create/images/full-frame", icon: undefined }} />
            </View>
        </AppBackgroundBase>
    )
}

function ModeItem({ y, grow }: any) {
    return <TouchableOpacity activeOpacity={.75} onPress={() => router.push(y.route)} className={clsx(grow ? "grow" : "flex-1", 'flex grow justify-center items-center rounded-md bg-bg-slim pt-3 px-5 pb-6')}>
        {y.icon}
        <Text className='text-text-secondary font-inter-medium text-lg'>{y.title}</Text>
    </TouchableOpacity>
}