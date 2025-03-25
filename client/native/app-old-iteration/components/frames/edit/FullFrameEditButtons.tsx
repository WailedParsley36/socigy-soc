import React, { } from 'react'
import { View } from 'react-native';
import TopAbsoluteRow from '@/components/TopAbsoluteRow';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Colors, Theme } from '@/constants/Colors';
import clsx from 'clsx';
import Feather from '@expo/vector-icons/Feather';
import EditButton from './EditButton';

interface FullFrameEditButtonsProps {
    hidden?: boolean
    onlyUiHide?: boolean
    userTagEnabled?: boolean
    children: any

    onUserTagToggle: () => void
    onUIHideToggle: () => void
}

export default function FullFrameEditButtons({ children, hidden, onlyUiHide, onUserTagToggle, onUIHideToggle, userTagEnabled }: FullFrameEditButtonsProps) {
    return <>
        <TopAbsoluteRow className={clsx(hidden && "hidden", 'z-10 pr-4')} itemsOverrideClassName='justify-between items-start'>
            <View className={clsx((onlyUiHide || userTagEnabled) && "opacity-0")}>
                {children}
            </View>

            <View className='gap-y-3'>
                <EditButton onPress={onUserTagToggle} hidden={onlyUiHide}>
                    <AntDesign name="adduser" size={30} color={Colors[Theme]['text-primary']} />
                </EditButton>
                <EditButton onPress={onUIHideToggle} hidden={userTagEnabled}>
                    <View className='justify-center items-center flex' style={{ height: 30 }}>
                        <Feather name="eye-off" size={25} color={Colors[Theme]['text-primary']} />
                    </View>
                </EditButton>
            </View>
        </TopAbsoluteRow>
    </>
}