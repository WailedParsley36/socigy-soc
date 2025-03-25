import { Text, TouchableOpacity, View } from "react-native";
import { useCallback, useMemo } from "react";
import { Image } from 'expo-image'
import * as MediaLibrary from 'expo-media-library'
import clsx from "clsx";
import React from "react";
import { GridAlbumInfo } from "./GridAlbumInfo";

interface AlbumGridItemProps {
    isSelected: boolean
    album: MediaLibrary.Album & { thumbnail: string }
    onPress: (album: GridAlbumInfo) => void
    disabled?: boolean
}
export default function AlbumGridItem({ disabled, album, isSelected, onPress }: AlbumGridItemProps) {
    const handleItemPress = useCallback(() => {
        onPress(album)
    }, [])

    const title = useMemo(() => {
        return album.title.length > 20 ? album.title.substring(0, 20) + "..." : album.title;
    }, [album.title])

    return (
        <TouchableOpacity disabled={disabled} activeOpacity={.85} onPress={handleItemPress} className='flex justify-center items-center rounded-lg shadow-lg z-20'>
            <Text className={clsx(isSelected ? "text-text-primary text-lg font-inter-bold" : "text-text-third", 'z-10 text-center absolute font-inter-medium inset-x-5')}>{title}</Text>
            <View style={{ width: 125, height: 100, zIndex: 5 }} className={clsx(isSelected ? "bg-black/45" : "bg-black/65", 'absolute rounded-lg')} />
            <Image source={{ uri: album.thumbnail }} style={{ width: 125, height: 100, borderRadius: 8 }} />
        </TouchableOpacity>
    )
}