import AppBackgroundBase from '@/components/background/AppBackgroundBase'
import FoundUserItem from '@/components/frames/edit/FoundUserItem'
import { Colors, Theme } from '@/constants/Colors'
import { useUserManager } from '@/managers/Exports'
import { RelationshipState, ShallowUserInfo, UserManagerType } from '@/managers/user/Exports'
import Feather from '@expo/vector-icons/Feather'
import clsx from 'clsx'
import { Image } from 'expo-image'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { FlatList, TouchableOpacity, TouchableOpacityProps } from 'react-native-gesture-handler'

export default function Search() {
    // Hooks
    const userManager = useUserManager()

    // States
    const [searchString, setSearchString] = useState<string>()
    const [userResult, setUserResult] = useState<ShallowUserInfo[]>()

    // Values
    const [userFriends, followedUsers, otherUsers] = useMemo(() => {
        let friends: ShallowUserInfo[] = []
        let followed: ShallowUserInfo[] = []
        let others: ShallowUserInfo[] = []
        userResult?.forEach(x => {
            if (x.relationship == RelationshipState.Friends)
                friends.push(x)
            else if (x.relationship == RelationshipState.Follower)
                followed.push(x)
            else
                others.push(x)
        });
        return [friends, followed, others]
    }, [userResult])


    // Callbacks
    const handleSearchChange = useCallback((value: string) => {
        setSearchString(value)
    }, [])

    const searchForUsers = useCallback(async (e?: any) => {
        // End reached
        if (e && userResult) {
            const newUsers = await userManager.queryUsersUnknown(searchString, 15, userResult!.length)
            setUserResult([...userResult, ...newUsers])
        }

        const newUsers = await userManager.queryUsersUnknown(searchString, 5, 0)
        setUserResult(newUsers)
    }, [searchString, userResult])

    const handleUpdateCurrentUserInfo = useCallback((info: ShallowUserInfo) => {
        setUserResult([...userResult!.map(x => {
            if (x.username == info.username && x.tag == info.tag)
                return info;
            return x;
        })])
    }, [userResult, setUserResult])

    // Effects
    useEffect(() => {
        if (searchString)
            searchForUsers();
        else
            setUserResult(undefined);
    }, [searchString])

    return (
        <AppBackgroundBase className="px-10 pt-10" canScroll additionalScrollViewProps={{ contentContainerClassName: "flex-1 pb-40" }}>
            <View className='flex-1'>
                <View className='border border-bg-light py-3 justify-center px-5 rounded-md'>
                    <Feather name="search" size={20} color={Colors[Theme]['bg-light']} className='absolute left-3' />
                    <TextInput className={clsx("text-text-primary", 'font-inter-regular')} onChangeText={handleSearchChange} style={{ paddingLeft: 24 }} placeholderTextColor={Colors[Theme]['text-third']} placeholder='Search for anything...' />
                </View>


                <View className='grow' />
                {userResult && (
                    <>
                        {userFriends.length > 0 && (
                            <View>
                                <Text className='text-text-primary font-inter-semibold text-lg mb-4'>Your friends</Text>
                                <FlatList
                                    scrollEnabled={false}
                                    data={userFriends}
                                    contentContainerClassName='gap-y-3'
                                    keyExtractor={(x, index) => x.username + x.tag + index}
                                    renderItem={x => <FoundUserItemAdvanced userManager={userManager} updateUserInfo={handleUpdateCurrentUserInfo} userInfo={x.item} />}
                                />
                            </View>
                        )}
                        {userFriends.length > 0 && (
                            <View>
                                <Text className='text-text-primary font-inter-semibold text-lg mb-4'>Following</Text>
                                <FlatList
                                    scrollEnabled={false}
                                    data={userFriends}
                                    contentContainerClassName='gap-y-3'
                                    keyExtractor={(x, index) => x.username + x.tag + index}
                                    renderItem={x => <FoundUserItemAdvanced userManager={userManager} updateUserInfo={handleUpdateCurrentUserInfo} userInfo={x.item} />}
                                />
                            </View>
                        )}
                        {otherUsers.length > 0 && (
                            <View>
                                <Text className='text-text-primary font-inter-semibold text-lg mb-4'>Other users</Text>
                                <FlatList
                                    scrollEnabled={false}
                                    data={userResult}
                                    contentContainerClassName='gap-y-3'
                                    keyExtractor={(x, index) => x.username + x.tag + index}
                                    renderItem={x => <FoundUserItemAdvanced userManager={userManager} updateUserInfo={handleUpdateCurrentUserInfo} userInfo={x.item} />}
                                />
                            </View>
                        )}
                    </>
                )}
            </View>
        </AppBackgroundBase>
    )
}

interface FoundUserItemAdvancedProps extends TouchableOpacityProps {
    userInfo: ShallowUserInfo
    userManager: UserManagerType
    updateUserInfo: (info: ShallowUserInfo) => void
}

function FoundUserItemAdvanced({ userInfo, userManager, updateUserInfo, className, ...rest }: FoundUserItemAdvancedProps) {
    const handleSendUserRequest = useCallback(async () => {
        const error = await userManager.sendUserFriendRequestByUsername(userInfo.username, userInfo.tag)
        if (error != null)
            return;

        updateUserInfo(userInfo)
    }, [userManager])

    const isRejected = useMemo(() => (userInfo.relationship & RelationshipState.Rejected) == RelationshipState.Rejected, [userInfo]);

    return <TouchableOpacity activeOpacity={.85} {...rest}>
        <View className={clsx(className ?? "bg-bg-ultraslim rounded", 'pl-6 flex-row flex items-center gap-x-5')}>
            {userInfo.iconUrl ?
                <Image source={{ uri: userInfo.iconUrl }} className='my-auto mr-4' style={{ height: 40, width: 40 }} />
                :
                <Feather name='user' size={40} color={Colors[Theme]['text-primary']} />
            }
            <View className='grow py-5'>
                <Text className='text-text-third'>#{userInfo.tag}</Text>
                <Text className='text-text-primary'>{userInfo.username}</Text>
            </View>
            {(userInfo.relationship == RelationshipState.None || isRejected) && (
                <>
                    {isRejected && <Text className='text-red-200'>Removed{'\r\n'}friend</Text>}
                    <TouchableOpacity onPress={handleSendUserRequest}>
                        <View className='py-2 border px-6 mr-5 border-text-third rounded bg-bg-lighter'>
                            <Text className='text-text-primary text-3xl'>+</Text>
                        </View>
                    </TouchableOpacity>
                </>
            )}
        </View>
    </TouchableOpacity>
}