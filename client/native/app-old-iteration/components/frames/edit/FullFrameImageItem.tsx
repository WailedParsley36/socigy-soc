import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image } from 'expo-image';
import { LayoutChangeEvent, ScaledSize, Text } from 'react-native';
import { View } from 'react-native';
import { ImageInfo } from '@/contexts/images/NewSelectedImageContext';
import { HandlerStateChangeEvent } from 'react-native-gesture-handler';
import { UserTagPositionEvent } from '@/components/frames/edit/Types';
import UserTagDisplay from './UserTagDisplay'

interface FullFrameImageItemProps {
    image: ImageInfo

    userTags: UserTagPositionEvent[]
    updateUserTags: (userTags: UserTagPositionEvent[]) => void

    tempUserTag?: UserTagPositionEvent
    updateTempUserTag: React.Dispatch<React.SetStateAction<UserTagPositionEvent | undefined>>

    dimensions: ScaledSize
    userTagEditEnabled: boolean

    hideUI: boolean
    index: number
}

export default function FullFrameImageItem({ index, hideUI, image, userTags, updateUserTags, dimensions, userTagEditEnabled, tempUserTag, updateTempUserTag }: FullFrameImageItemProps) {
    // Values
    const [overridenHeight, setOverridenHeight] = useState<number>();
    const computedWidthSlope = useMemo(() => image.edited && overridenHeight ? (overridenHeight! * image.edited.aspectRatio) : dimensions.width, [image.edited, overridenHeight]);

    // Effects
    useEffect(() => {
        if (!overridenHeight) {
            // Changing the position back to absolute
            updateUserTags(userTags.map(x => ({ ...x, current: x.absolute })))
            return;
        }

        const xDifference = (dimensions.width - computedWidthSlope) / 2;

        if (userTags && userTags.length > 0) {
            const mapped = userTags.map(x => {
                return {
                    ...x,
                    current: {
                        positionX: x.current.positionX * (computedWidthSlope / dimensions.width) + xDifference,
                        positionY: x.current.positionY * (overridenHeight / dimensions.height)
                    }
                }
            })
            updateUserTags(mapped)
        }

        if (!tempUserTag || tempUserTag.absolute.positionY != tempUserTag.current.positionY)
            return;

        const updatedTag = {
            ...tempUserTag,
            current: {
                positionX: tempUserTag.current.positionX * (computedWidthSlope / dimensions.width) + xDifference,
                positionY: tempUserTag.current.positionY * (overridenHeight / dimensions.height)
            }
        }
        updateTempUserTag(updatedTag)
    }, [overridenHeight])

    useEffect(() => {
        if (tempUserTag?.index != index || !tempUserTag?.user)
            return;

        tempUserTag.current = tempUserTag.absolute;
        userTags.push({ ...tempUserTag })
        updateUserTags(userTags)
        updateTempUserTag(undefined)
    }, [tempUserTag])

    // Callbacks
    const handleUserTagTap = useCallback((e: HandlerStateChangeEvent) => {
        const currentX = Math.round(e.nativeEvent.absoluteX as number)
        const currentY = Math.round(e.nativeEvent.absoluteY as number)

        if (overridenHeight)
            return {
                index: index,
                current: {
                    positionX: currentX,
                    positionY: currentY
                },
                absolute: {
                    positionX: Math.round((currentX - (dimensions.width - computedWidthSlope) / 2) / (computedWidthSlope / dimensions.width)),
                    positionY: Math.round(currentY / (overridenHeight! / dimensions.height))
                }
            };
        else
            return {
                index: index,
                current: {
                    positionX: currentX,
                    positionY: currentY
                },
                absolute: {
                    positionX: currentX,
                    positionY: currentY
                }
            }
    }, [computedWidthSlope, dimensions, overridenHeight])

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        if (e.nativeEvent.layout.height == dimensions.height)
            setOverridenHeight(undefined)
        else
            setOverridenHeight(e.nativeEvent.layout.height);
    }, [])

    const handleUserTagDelete = useCallback((userTag: UserTagPositionEvent) => {
        updateUserTags(userTags.filter(x => x != userTag))
    }, [userTags, updateUserTags])

    return (
        <View style={{ width: dimensions.width }} className='bg-black flex justify-center items-center' onLayout={handleLayout}>
            {!image.edited &&
                <Text className='text-text-primary bg-bg-ultraslim/80 rounded-full py-2 px-6 font-inter-semibold text-lg absolute top-12 z-20'>Processing image...</Text>
            }

            <UserTagDisplay tagsHidden={hideUI} userTags={userTags} onUserTagDelete={handleUserTagDelete} userTagEditEnabled={userTagEditEnabled} hitSlop={{
                top: 0,
                left: (dimensions.width - computedWidthSlope) / 2,
                width: dimensions.width,
                height: overridenHeight ?? dimensions.height
            }} onTempUserTagPlaced={handleUserTagTap} tempUserTag={tempUserTag} updateTempUserTag={updateTempUserTag} />

            <Image source={{ uri: image.edited ? image.edited.uri : image.uri }} contentPosition='center' contentFit={image.edited ? 'contain' : "cover"} style={{ height: overridenHeight ?? dimensions.height, width: dimensions.width }} />
        </View>
    )
}