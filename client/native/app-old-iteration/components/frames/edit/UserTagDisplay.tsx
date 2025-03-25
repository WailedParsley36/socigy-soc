import React, { useCallback, useEffect } from 'react'
import { Keyboard } from 'react-native';
import { View } from 'react-native';
import { HandlerStateChangeEvent, TapGestureHandler } from 'react-native-gesture-handler';
import clsx from 'clsx';
import { HitSlop } from 'react-native-gesture-handler/lib/typescript/handlers/gestureHandlerCommon';
import { UserTagPositionEvent } from '@/components/frames/edit/Types';
import UserTagItem from '@/components/frames/edit/UserTagItem';

interface UserTagDisplayProps {
    userTags: UserTagPositionEvent[],
    onUserTagDelete: (userTag: UserTagPositionEvent) => void,

    tempUserTag?: UserTagPositionEvent
    updateTempUserTag: React.Dispatch<React.SetStateAction<UserTagPositionEvent | undefined>>
    onTempUserTagPlaced: (e: HandlerStateChangeEvent) => UserTagPositionEvent

    userTagEditEnabled: boolean
    tagsHidden?: boolean
    hitSlop: HitSlop
}

const maxUserTags = 20;

export default function UserTagDisplay({ tagsHidden, userTags, onUserTagDelete, userTagEditEnabled, hitSlop, onTempUserTagPlaced, tempUserTag, updateTempUserTag }: UserTagDisplayProps) {

    useEffect(() => {
        updateTempUserTag(undefined)
    }, [userTagEditEnabled])

    const handleUserTagTap = useCallback((e: HandlerStateChangeEvent) => {
        if (userTags.length >= maxUserTags) {
            alert("You can tag up to 20 people in one image. For more tag them in the description")
            return;
        }

        //@ts-ignore
        if (e.nativeEvent.absoluteX as number < hitSlop.left) {
            return
        }

        const tempTag = onTempUserTagPlaced(e);
        updateTempUserTag(tempTag)
    }, [onTempUserTagPlaced, userTags])

    return (
        <TapGestureHandler enabled={userTagEditEnabled} hitSlop={hitSlop} onActivated={handleUserTagTap} shouldCancelWhenOutside>
            <View className={clsx((Keyboard.isVisible() || tagsHidden) && 'hidden', 'z-10 absolute inset-0')}>
                {userTags.map((x: UserTagPositionEvent, index: number) =>
                    <UserTagItem key={index} userTag={x} disablePress={userTagEditEnabled} onLongPress={() => onUserTagDelete(x)} />
                )}
                {(userTagEditEnabled && tempUserTag) &&
                    <UserTagItem userTag={tempUserTag} />
                }
            </View>
        </TapGestureHandler>
    )
}