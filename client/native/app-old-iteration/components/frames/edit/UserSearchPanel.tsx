import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Text } from 'react-native';
import { View } from 'react-native';
import { Colors, Theme } from '@/constants/Colors';
import { TextInput } from 'react-native-gesture-handler';
import clsx from 'clsx';
import Feather from '@expo/vector-icons/Feather';
import { useUserManager } from '@/managers/Exports';
import { ShallowUserInfo } from '@/managers/user/Exports';
import { UserTagPositionEvent } from '@/components/frames/edit/Types';
import FoundUserItem from './FoundUserItem';

interface UserSearchPanelProps {
    hidden: boolean
    fullHeight: number
    updateTempUserTag: React.Dispatch<React.SetStateAction<UserTagPositionEvent | undefined>>

    keyboardVisible: boolean
    updateVisibility: React.Dispatch<React.SetStateAction<boolean>>
    isVisible: boolean
}

export default function UserSearchPanel({ hidden, fullHeight, updateVisibility, isVisible, keyboardVisible, updateTempUserTag }: UserSearchPanelProps) {
    // States
    const [queryInput, setQueryInput] = useState<string>();
    const [foundUsers, setFoundUsers] = useState<ShallowUserInfo[]>()
    const userManager = useUserManager();

    // Effects
    useEffect(() => {
        if (keyboardVisible)
            updateVisibility(true)
    }, [keyboardVisible])

    useEffect(() => {
        handleQueryChanged("")
    }, [])

    // Callbacks
    const handleQueryChanged = useCallback(async (value: string) => {
        setQueryInput(value)

        setFoundUsers(undefined)
        setFoundUsers(await userManager.queryUsersUnknown(value, 25, undefined, true));
    }, [queryInput])

    const handleEndReached = useCallback(async () => {
        if (!foundUsers)
            return;

        const users = await userManager.queryUsersUnknown(queryInput, 25, foundUsers!.length, true);
        setFoundUsers(prev => {
            if (prev)
                return [...prev, ...users]
            else
                return users;
        });
    }, [queryInput, foundUsers, setFoundUsers])

    const handleUserSelected = useCallback((x: ShallowUserInfo) => {
        updateVisibility(false)
        //@ts-ignore
        updateTempUserTag(prev => ({ ...prev, user: { ...x } }))
    }, [updateTempUserTag])

    return (
        <View className={clsx(hidden && "hidden", isVisible ? "pb-12 pt-20" : "py-12", "px-8 w-full")} style={{ height: isVisible ? fullHeight : undefined }}>
            <View className='border border-bg-light py-3 justify-center px-5 rounded-md'>
                <Feather name="search" size={20} color={Colors[Theme]['bg-light']} className='absolute left-3' />
                <TextInput className={clsx("text-text-primary", 'font-inter-regular')} onChangeText={handleQueryChanged} style={{ paddingLeft: 24 }} placeholderTextColor={Colors[Theme]['text-third']} placeholder='Usernamce / Email / Phone' />
            </View>
            {foundUsers ?
                <FlatList
                    data={foundUsers}
                    className={clsx(isVisible ? "flex-1" : "h-1/5", 'mt-6')}
                    keyExtractor={(x, index) => x.username + x.tag + index}
                    removeClippedSubviews
                    contentContainerClassName='gap-y-2 pb-24 pt-6'
                    onEndReached={handleEndReached}
                    renderItem={x => <FoundUserItem userInfo={x.item} onPress={() => handleUserSelected(x.item)} />}
                />
                :
                <View className='flex-1 flex justify-center items-center animate-pulse'>
                    <Text className='text-text-primary  text-center mt-6 font-inter-medium'>Searching for a match</Text>
                </View>
            }
        </View>
    )
}