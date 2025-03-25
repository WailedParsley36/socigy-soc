import React, { } from 'react'
import { Image } from 'expo-image';
import { Text } from 'react-native';
import { View } from 'react-native';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native-gesture-handler';
import clsx from 'clsx';
import Feather from '@expo/vector-icons/Feather';
import { ShallowUserInfo } from '@/managers/user/Exports';
import { Colors, Theme } from '@/constants/Colors';

interface FoundUserItemProps extends TouchableOpacityProps {
    userInfo: ShallowUserInfo
}

export default function FoundUserItem({ className, userInfo, ...rest }: FoundUserItemProps) {
    return (
        <TouchableOpacity activeOpacity={.85} {...rest}>
            <View className={clsx(className ?? "bg-bg-ultraslim rounded", 'py-3 px-6 flex-row flex items-center gap-x-5')}>
                {userInfo.iconUrl ?
                    <Image source={{ uri: userInfo.iconUrl }} className='my-auto mr-4' style={{ height: 40, width: 40 }} />
                    :
                    <Feather name='user' size={40} color={Colors[Theme]['text-primary']} />
                }
                <View>
                    <Text className='text-text-third'>#{userInfo.tag}</Text>
                    <Text className='text-text-primary'>{userInfo.username}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}