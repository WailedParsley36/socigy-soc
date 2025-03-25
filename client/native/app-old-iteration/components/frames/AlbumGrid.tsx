import { FlatList, View, FlatListProps, ListRenderItem } from "react-native";
import { useCallback, useEffect, useState } from "react";
import * as MediaLibrary from 'expo-media-library'
import React from "react";
import AlbumGridItem from "./AlbumGridItem";
import { GridAlbumInfo } from "./GridAlbumInfo";

interface AlbumGridProps {
    selectedAlbumId: string | undefined
    updateAlbumId: React.Dispatch<React.SetStateAction<string | undefined>>
    overrideRenderItem?: ListRenderItem<GridAlbumInfo>
    disabled?: boolean
}

export default function AlbumGrid({ horizontal, disabled = false, selectedAlbumId, updateAlbumId, overrideRenderItem, ...rest }: AlbumGridProps & Omit<FlatListProps<GridAlbumInfo>, keyof { data: null, renderItem: null }>) {
    const [loadedAlbums, setLoadedAlbums] = useState<GridAlbumInfo[]>([]);

    useEffect(() => {
        async function loadAlbums() {
            const recentImages = (await MediaLibrary.getAssetsAsync({
                sortBy: [MediaLibrary.SortBy.modificationTime],
                first: 1
            })).assets;

            let albums: any[] = []
            if (recentImages.length > 0) {
                albums = [{
                    id: undefined,
                    title: "Recents",
                    thumbnail: recentImages[0].uri
                }]
            }

            albums = [
                ...albums,
                ...(await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true })).filter(x => x.assetCount > 0)
            ]
            setLoadedAlbums(albums)

            const noPhotoSet = new Set();
            for (let i = 1; i < albums.length; i++) {
                const assets = await MediaLibrary.getAssetsAsync({
                    mediaType: MediaLibrary.MediaType.photo,
                    sortBy: [MediaLibrary.SortBy.modificationTime],
                    album: albums[i].id,
                    first: 1
                });

                const thumbnailUri = assets.totalCount != 0 ? assets.assets[0].uri : undefined;
                if (!thumbnailUri)
                    noPhotoSet.add(albums[i].id)
                else
                    albums[i].thumbnail = thumbnailUri;
            }

            setLoadedAlbums([...albums.filter(x => !noPhotoSet.has(x.id))])
        }

        if (loadAlbums.length > 0)
            return;

        loadAlbums();
    }, [])

    const handleAlbumPress = useCallback((album: MediaLibrary.Album) => {
        updateAlbumId(album.id)
    }, [updateAlbumId])

    return <View className='py-5'>
        <FlatList
            data={loadedAlbums}
            showsHorizontalScrollIndicator={false}
            horizontal={horizontal}
            contentContainerClassName='flex-row gap-x-5 px-5'
            keyExtractor={x => x.id ?? "recents"}
            renderItem={overrideRenderItem ? overrideRenderItem : (x => <AlbumGridItem disabled={disabled} album={x.item} isSelected={selectedAlbumId == x.item.id} onPress={handleAlbumPress} />)}
            {...rest}
        />
    </View>
}