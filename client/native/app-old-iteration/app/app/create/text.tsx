import AppBackgroundBase from '@/components/background/AppBackgroundBase'
import React from 'react'
import { Text } from 'react-native'
import { useLayoutReset } from './_layout';

export default function CreateText() {
    useLayoutReset();

    return (
        <AppBackgroundBase className="justify-center items-center">
            <Text className='text-text-primary'>Create Text</Text>
        </AppBackgroundBase>
    )
}