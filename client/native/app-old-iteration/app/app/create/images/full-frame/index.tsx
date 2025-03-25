import AppBackgroundBase from '@/components/background/AppBackgroundBase'
import { BackButton } from '@/components/navigation/BackButton'
import React, { createRef, useEffect, useState } from 'react'
import { Dimensions, Easing, Pressable, Text, TouchableOpacity, View } from 'react-native'
import * as MediaLibrary from 'expo-media-library';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image'
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDecay, withSpring } from 'react-native-reanimated';
import { FlatList } from 'react-native-gesture-handler';
import clsx from 'clsx';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomItemSwitcher from '@/components/input/BottomItemSwitcher';
import GalleryImagePicker from '@/components/frames/GalleryImagePicker';
import CameraImageTaker from '@/components/frames/CameraImageTaker';
import useSelectedImages from '@/contexts/images/NewSelectedImageContext';

export default function CreateFullFrames() {
    const [gallerySelected, setGallerySelected] = useState<string>("Gallery");
    const { images, indexedImages, update } = useSelectedImages();

    return (
        <AppBackgroundBase isSafe={false}>
            <GalleryImagePicker hidden={gallerySelected != "Gallery"} selectedImages={images} selectedIndexedImages={indexedImages} updateSelectedImages={update} />
            {/* <GalleryImagePicker hidden={gallerySelected != "Gallery"} selectedImages={images} selectedIndexedImages={indexedImages} updateSelectedImages={update} /> */}
            {gallerySelected == "Camera" &&
                <CameraImageTaker selectedImages={images} selectedIndexedImages={indexedImages} updateSelectedImages={update} />
            }

            <BottomItemSwitcher selected={gallerySelected} items={["Gallery", "Camera"]} onItemSelected={(x) => { setGallerySelected(x); update({ images: [], indexedImages: {} }) }} />
        </AppBackgroundBase>
    )
}
