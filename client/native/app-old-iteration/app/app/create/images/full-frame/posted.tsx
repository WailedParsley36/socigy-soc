import AppBackgroundBase from '@/components/background/AppBackgroundBase'
import { Colors, Theme } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

export default function Posted() {
    const { posted } = useLocalSearchParams();
    const postedDate = posted ? undefined : Date.parse(posted as string);
    if (postedDate && isNaN(postedDate) && !isNaN(postedDate)) {
        return <Redirect href='/app' />
    }

    return (
        <AppBackgroundBase className='flex-1 items-center justify-center gap-y-3'>
            <View className='gap-y-5'>
                {posted ?
                    <>
                        <FontAwesome6 name="calendar-check" size={24} color={Colors[Theme]['text-primary']} />
                        <Text className='text-text-primary text-center'>Your post was scheduled!</Text>
                    </>
                    :
                    <>
                        <Feather className='text-center' name="check-circle" size={24} color={Colors[Theme]['text-primary']} />
                        <Text className='text-text-primary text-center'>Your post was successfully uploaded!</Text>
                    </>
                }
            </View>
            <TouchableOpacity onPress={() => router.replace("/app")} className='bg-text-primary py-4 px-6'>
                <Text className='text-text-inverted'>Go back home</Text>
            </TouchableOpacity>
        </AppBackgroundBase>
    )
}