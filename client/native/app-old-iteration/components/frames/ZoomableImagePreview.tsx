import { ReactNativeZoomableView, ReactNativeZoomableViewProps } from "@openspacelabs/react-native-zoomable-view";
import { Text, TouchableOpacity, View, LayoutChangeEvent } from "react-native";
import { createRef, useCallback, useState } from "react";
import { Image } from 'expo-image'
import * as MediaLibrary from 'expo-media-library'
import clsx from "clsx";
import React from "react";
import { BackButton } from "../navigation/BackButton";

import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useDimensions } from "@/hooks/useDimensions";
import FillingView from "../FillingView";
import TopAbsoluteRow from "../TopAbsoluteRow";

interface ZoomableImageViewProps {
    loadedImage?: MediaLibrary.Asset
    fullScreen: boolean
    setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>
    priority?: "high" | "low" | "normal" | null | undefined
    aspectRatio?: number
    updateMultiSelect?: React.Dispatch<React.SetStateAction<boolean>>
}
export default function ZoomableImagePreview({ loadedImage, updateMultiSelect, aspectRatio = 9 / 16, priority, fullScreen, setIsFullScreen, ...rest }: Omit<ReactNativeZoomableViewProps, keyof { animatePin: "" }> & ZoomableImageViewProps) {
    // States
    const zoomRef = createRef<ReactNativeZoomableView>()
    const screenDimensions = useDimensions('screen')
    const [containerSize, setContainerSize] = useState<{ width: number, height: number }>({ width: screenDimensions.width, height: screenDimensions.height / 3 });

    // Callbacks
    const handleSetContainerLayout = useCallback((e: LayoutChangeEvent) => {
        setContainerSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
    }, [])

    const toggleFullscreen = useCallback(() => {
        setIsFullScreen(prev => !prev)
        zoomRef.current?.zoomTo(1, { x: 0, y: 0 });
    }, []);

    const toggleMultiselect = useCallback(() => {
        updateMultiSelect!(prev => !prev)
    }, [updateMultiSelect]);

    // Rendering
    if (!loadedImage)
        return (
            <FillingView className="flex justify-center items-center w-full">
                <Text className="text-text-primary text-center">Loading image preview...</Text>
            </FillingView>
        )

    const imageHeight = fullScreen ? screenDimensions.height : containerSize.height;
    const imageWidth = fullScreen ? screenDimensions.height * aspectRatio : containerSize.width * (loadedImage.width / loadedImage.height);

    return <FillingView onLayout={handleSetContainerLayout}>
        {fullScreen &&
            <TopAbsoluteRow>
                <BackButton onPress={() => setIsFullScreen(false)} fallbackRoute="/app/create" height="25" width="40" />
            </TopAbsoluteRow>
        }
        <ReactNativeZoomableView
            ref={zoomRef}

            initialZoom={1}
            minZoom={.85}
            maxZoom={10}

            contentHeight={fullScreen ? imageHeight : undefined}
            contentWidth={fullScreen ? imageWidth : undefined}
            {...rest}
        >
            <Image source={{ uri: loadedImage.uri }} transition={250} priority={priority} allowDownscaling style={{ height: imageHeight, width: imageWidth }} />
        </ReactNativeZoomableView>
        <View className="absolute bottom-6 px-3 w-full flex-row">
            <TouchableOpacity activeOpacity={.75} onPress={toggleFullscreen} className={clsx(fullScreen ? "rounded-full bg-bg-ultraslim p-4" : "rounded-full bg-bg-ultraslim p-3")}>
                {fullScreen ?
                    <Feather name="minimize-2" size={30} color="white" />
                    :
                    <Entypo name="resize-full-screen" size={20} color="white" />
                }
            </TouchableOpacity>
            <View className="grow flex-row justify-end items-end">
                {!fullScreen && updateMultiSelect &&
                    <TouchableOpacity activeOpacity={.75} onPress={toggleMultiselect} className={clsx(fullScreen ? "rounded-full bg-bg-ultraslim p-4" : "rounded-full bg-bg-ultraslim p-3")}>
                        <MaterialCommunityIcons name="image-multiple-outline" size={20} color="white" />
                    </TouchableOpacity>
                }
            </View>
        </View>
    </FillingView>
}