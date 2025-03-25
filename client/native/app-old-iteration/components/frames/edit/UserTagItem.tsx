import { Colors, Theme } from "@/constants/Colors";
import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import { Image } from 'expo-image';
import React from "react";
import { UserTagPositionEvent } from "./Types";

interface UserTagItemProps {
    userTag: UserTagPositionEvent
    onLongPress?: (userTag: UserTagPositionEvent) => void
    disablePress?: boolean
}

export default function UserTagItem({ userTag, onLongPress, disablePress = false }: UserTagItemProps) {
    const [expanded, setExpanded] = useState<boolean>(false)
    const handleSetExpanded = useCallback(() => {
        if (disablePress)
            return;

        setExpanded(prev => !prev)
    }, [setExpanded, disablePress])

    return <TouchableOpacity activeOpacity={.95} onPress={handleSetExpanded} onLongPress={() => onLongPress && onLongPress(userTag)}>
        <View className='py-3 absolute px-5 rounded-xl bg-bg-ultraslim' style={{
            left: userTag.current.positionX,
            top: userTag.current.positionY,
            transform: [{ translateX: "-50%" }]
        }}>
            <Svg viewBox="0 0 109 50" fill="none" style={{ position: 'absolute', left: '50%', height: 30, width: 40, borderRadius: 30, transform: [{ translateX: -5 }, { translateY: -20 }] }}>
                <Path fill={Colors[Theme]['bg-ultraslim']} d="M0.0544404 49.0544L43.8934 5.21549C49.7513 -0.642371 59.2487 -0.642382 65.1066 5.21548L108.946 49.0544H0.0544404Z" />
            </Svg>

            {(expanded && userTag.user) &&
                <>
                    <View className='flex justify-center items-center'>
                        <Image source={{ uri: userTag.user.iconUrl }} style={{ height: 32, width: 32 }} className='mb-3' />
                    </View>
                    <Text className='text-text-third text-center'>#{userTag.user!.tag}</Text>
                </>
            }
            <Text className='text-text-primary text-center'>{userTag.user ? userTag.user.username : "Who's here?"}</Text>
        </View>
    </TouchableOpacity>
}