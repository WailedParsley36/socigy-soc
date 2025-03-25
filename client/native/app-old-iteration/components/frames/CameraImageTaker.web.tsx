import { View, Dimensions } from "react-native";
import clsx from "clsx";
import React from "react";
import { ImageInfo, IndexedImages } from "@/contexts/images/NewSelectedImageContext";

const singleImagePreviewProps = {
    buttonTitles: ["Delete", "Another", "Done"]
}

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

export default function CameraImageTaker({ hidden, className }: Props) {
    return (
        <View className={clsx(hidden && "hidden", className, "")} style={{ height: Dimensions.get('screen').height }}>

        </View >
    );
}