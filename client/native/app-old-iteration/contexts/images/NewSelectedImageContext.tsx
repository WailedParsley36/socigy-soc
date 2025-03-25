import { UserTagInfo } from "@/components/frames/edit/Types";
import React, { createContext, useContext, useEffect, useState } from "react";


export interface ImageInfo {
    id: string
    url: string,
    edited?: ImageInfo

    aspectRatio: number
    height: number
    width: number
    userTags?: UserTagInfo[]
}

export type IndexedImages = { [id: string]: ImageInfo }

interface SelectedImagesContextInfo {
    images: ImageInfo[]
    indexedImages: { [id: string]: ImageInfo }
    update: React.Dispatch<React.SetStateAction<{ images: ImageInfo[], indexedImages: IndexedImages }>>
}

const initialValue = { images: [], indexedImages: {}, update: () => { } }
const SelectedImagesContext = createContext<SelectedImagesContextInfo>(initialValue);

export function SelectedImagesContextProvider({ children }: any) {
    const [selectedImages, setSelectedImages] = useState<SelectedImagesContextInfo>(initialValue);

    useEffect(() => {
        function update(value: React.SetStateAction<{ images: ImageInfo[], indexedImages: IndexedImages }>) {
            if (typeof value === 'function') {
                setSelectedImages(prev => ({ ...value(prev), update: update }))
            }
            else
                setSelectedImages({ ...value, update: update })
        }

        setSelectedImages({ ...selectedImages, update: update })
    }, [])

    return <SelectedImagesContext.Provider value={selectedImages}>
        {children}
    </SelectedImagesContext.Provider>
}

export default function useSelectedImages() {
    return useContext(SelectedImagesContext);
}