import { View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import * as MediaLibrary from 'expo-media-library'
import clsx from "clsx";
import React from "react";
import { BackButton } from "../navigation/BackButton";
import { router } from "expo-router";

import { ImageInfo, IndexedImages } from "@/contexts/images/NewSelectedImageContext";
import AlbumGrid from "./AlbumGrid";
import { useDimensions } from "@/hooks/useDimensions";
import GalleryGrid from "./GalleryGrid";
import FillingView from "../FillingView";
import TopAbsoluteRow from "../TopAbsoluteRow";
import NextButton from "./NextButton";
import ZoomableImagePreview from "./ZoomableImagePreview";

interface Props {
    className?: string
    hidden?: boolean
    selectedImages: ImageInfo[]
    selectedIndexedImages: IndexedImages
    updateSelectedImages: React.Dispatch<React.SetStateAction<{
        images: ImageInfo[];
        indexedImages: IndexedImages;
    }>>
}

export default function ImprovedGalleryImagePicker({ className, hidden, selectedImages, selectedIndexedImages, updateSelectedImages }: Props) {
    // States
    const [focusedImage, setFocusedImage] = useState<MediaLibrary.Asset>()
    const [multiSelect, setMultiSelect] = useState<boolean>(false)
    const [previewFullScreen, setPreviewFullScreen] = useState<boolean>(false);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string>();
    const screenDimensions = useDimensions('screen')
    const [albumsDisabled, setAlbumsDisabled] = useState<boolean>(true)
    const [permissionsGranted, setPermissionsGranted] = useState<boolean>();

    useEffect(() => {
        setPreviewFullScreen(false)
    }, [hidden])

    useEffect(() => {
        async function init() {
            const response = await MediaLibrary.getPermissionsAsync();
            setPermissionsGranted(response.granted)
        }
        init()
    }, [])

    // Functions
    const handleContinue = useCallback(() => {
        if (!focusedImage)
            return;

        if (selectedImages.length == 0) {
            const indexed: IndexedImages = {}
            const newItem: ImageInfo = { id: focusedImage.id, uri: focusedImage.uri, aspectRatio: focusedImage.width / focusedImage.height, height: focusedImage.height, width: focusedImage.width };
            indexed[focusedImage.id] = newItem
            updateSelectedImages(prev => ({ images: [newItem], indexedImages: indexed }))
        }

        router.navigate('/app/create/images/full-frame/edit')
    }, [focusedImage, selectedImages])
    const handleImageFocus = useCallback((image: MediaLibrary.Asset) => {
        setFocusedImage(() => image)
    }, [])
    const handleFirstBatch = useCallback((images: MediaLibrary.Asset[]) => {
        if (!permissionsGranted) {
            setPermissionsGranted(true);
        }

        setFocusedImage(prev => {
            if (prev != undefined)
                return prev;

            const indexed: IndexedImages = {}
            const newItem: ImageInfo = { id: images[0].id, uri: images[0].uri, aspectRatio: images[0].width / images[0].height, height: images[0].height, width: images[0].width };
            indexed[images[0].id] = newItem
            updateSelectedImages(prev => ({ images: [newItem], indexedImages: indexed }))
            return images[0]
        })
    }, [updateSelectedImages, permissionsGranted, setPermissionsGranted])

    // Computed Values
    const showNextButton = focusedImage || selectedImages.length > 0;

    // Renderings
    return (
        <FillingView hidden={hidden} className={className}>
            <TopAbsoluteRow className={clsx(previewFullScreen && "hidden")}>
                <BackButton fallbackRoute={"/app/create"} height="40" width="65" strokeWidth={2} />
                {showNextButton && <NextButton onPress={handleContinue} />}
            </TopAbsoluteRow>
            <View className={clsx(!permissionsGranted && "hidden", previewFullScreen && "z-20 bg-bg-default", "w-full")} style={{ height: previewFullScreen ? screenDimensions.height : screenDimensions.height / 3 }}>
                <ZoomableImagePreview
                    loadedImage={focusedImage}
                    updateMultiSelect={setMultiSelect}
                    fullScreen={previewFullScreen}
                    setIsFullScreen={setPreviewFullScreen}
                />
            </View>
            <View className={clsx(previewFullScreen ? "hidden" : !permissionsGranted ? "flex-1" : "h-2/3")}>
                <AlbumGrid
                    horizontal
                    className={clsx(!permissionsGranted && "hidden")}
                    updateAlbumId={setSelectedAlbumId}
                    selectedAlbumId={selectedAlbumId}
                    disabled={albumsDisabled}
                />

                <GalleryGrid
                    onImageBatchLoaded={handleFirstBatch}
                    onAllImagesLoaded={() => setAlbumsDisabled(false)}
                    batchSize={50}
                    hidden={hidden}
                    albumId={selectedAlbumId}
                    onImageSelected={handleImageFocus}
                    maxSelectedImages={10}
                    selectedIndexedImages={selectedIndexedImages}
                    selectedImages={selectedImages}
                    updateSelectedImages={updateSelectedImages}
                    multiSelect={multiSelect}
                    setMultiSelect={setMultiSelect}
                />
            </View>
        </FillingView>
    )
}