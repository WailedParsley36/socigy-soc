import { Text, TouchableOpacity, View, ScaledSize } from "react-native";
import { useCallback } from "react";
import { Image } from 'expo-image'
import * as MediaLibrary from 'expo-media-library'
import clsx from "clsx";
import React from "react";

const blurhash = "LA9aBQj[00WBj[ayayof00ay~qj["

interface GalleryGridItemProps {
    image: MediaLibrary.Asset
    recyclingKey: string
    imageWidth?: number
    imageHeight?: number,
    dimensions?: ScaledSize
    columns?: number,

    isSelected: boolean
    selectedIndex?: number
    showMultiselect: boolean

    onPress?: (image: MediaLibrary.Asset) => void
    onLongPress?: (image: MediaLibrary.Asset) => void
}
export default function GalleryGridItem({ image, isSelected, selectedIndex, showMultiselect, imageHeight = 100, imageWidth, dimensions, columns, recyclingKey, onPress, onLongPress }: GalleryGridItemProps) {
    const handleItemPress = useCallback(() => {
        onPress && onPress(image)
    }, [image])

    const handleItemLongPress = useCallback(() => {
        onLongPress && onLongPress(image)
    }, [image])

    return (
        <TouchableOpacity activeOpacity={.75} onPress={handleItemPress} onLongPress={handleItemLongPress}>
            {
                showMultiselect &&
                <View className={clsx("absolute border-2 border-text-primary z-10 right-2 top-2 rounded-full flex justify-center items-center", isSelected && "bg-blue-500")} style={{ height: 25, width: 25 }}>
                    {isSelected &&
                        <Text className="text-text-primary font-inter-bold">
                            {selectedIndex}
                        </Text>
                    }
                </View>
            }
            <Image source={{ uri: image.uri }} style={{ height: imageHeight, width: imageWidth ?? dimensions!.width / columns! }} placeholder={{ blurhash }} allowDownscaling recyclingKey={recyclingKey} />
        </TouchableOpacity>
    )
}