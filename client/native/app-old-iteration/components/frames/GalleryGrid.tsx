import { FlashList, ListRenderItem } from "@shopify/flash-list";
import {
  Text,
  TouchableOpacity,
  View,
  Linking,
  ListRenderItemInfo,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import React from "react";

import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";

import {
  ImageInfo,
  IndexedImages,
} from "@/contexts/images/NewSelectedImageContext";
import { Colors, Theme } from "@/constants/Colors";
import { useDimensions } from "@/hooks/useDimensions";
import FillingView from "../FillingView";
import GalleryGridItem from "./GalleryGridItem";

interface GalleryAssetInfo extends MediaLibrary.Asset {
  hidden: boolean;
}

interface GalleryGridProps {
  albumId?: string;
  after?: MediaLibrary.AssetRef;
  sortBy?: MediaLibrary.SortByValue[];
  batchSize?: number;

  selectedIndexedImages: IndexedImages;
  selectedImages: ImageInfo[];
  updateSelectedImages: React.Dispatch<
    React.SetStateAction<{
      images: ImageInfo[];
      indexedImages: IndexedImages;
    }>
  >;

  onImageBatchLoaded?: (images: MediaLibrary.Asset[]) => void;
  onAllImagesLoaded?: (images: MediaLibrary.Asset[]) => void;
  onImageSelected?: (image: MediaLibrary.Asset) => void;
  onImageDeselected?: (image: MediaLibrary.Asset) => void;

  overrideRenderItem?: ListRenderItem<GalleryAssetInfo>;
  imageWidth?: number;
  imageHeight?: number;
  columnNumber?: number;

  multiSelect: boolean;
  setMultiSelect: React.Dispatch<React.SetStateAction<boolean>>;

  maxSelectedImages?: number;
  hidden?: boolean;
}
export default function GalleryGrid({
  maxSelectedImages,
  onImageDeselected,
  onImageSelected,
  onAllImagesLoaded,
  onImageBatchLoaded,
  selectedIndexedImages,
  multiSelect,
  setMultiSelect,
  updateSelectedImages,
  selectedImages,
  albumId,
  after,
  imageHeight = 100,
  imageWidth,
  overrideRenderItem,
  columnNumber = 4,
  hidden,
  sortBy = [MediaLibrary.SortBy.modificationTime],
  batchSize = 100,
}: GalleryGridProps) {
  const [permissionResponse, requestPermissionsAsync] =
    MediaLibrary.usePermissions({
      writeOnly: false,
      granularPermissions: ["photo"],
    });
  const [loadedAssets, setLoadedAssets] = useState<GalleryAssetInfo[]>([]);

  const windowDimensions = useDimensions("window");
  const estimatedListSize = useMemo(() => {
    return {
      width: windowDimensions.width,
      height: (windowDimensions.height / 3) * 2 - 60,
    };
  }, []);
  const showedItems = useMemo(() => {
    return loadedAssets.filter((x) => !x.hidden);
  }, [loadedAssets]);

  useEffect(() => {
    if (
      !permissionResponse ||
      !permissionResponse.granted ||
      loadedAssets.length > 0
    )
      return;

    async function batchLoadImages() {
      let assetResponse;
      const loadedImages: MediaLibrary.Asset[] = [];
      do {
        assetResponse = await MediaLibrary.getAssetsAsync({
          after:
            assetResponse && assetResponse.endCursor
              ? assetResponse.endCursor
              : after,
          album: albumId,
          sortBy: sortBy,
          mediaType: "photo",
          first: batchSize,
        });
        loadedImages.push(...assetResponse.assets);

        // Event propagation
        onImageBatchLoaded && onImageBatchLoaded(assetResponse.assets);
        setLoadedAssets([
          ...loadedImages.map((x) => ({ ...x, hidden: false })),
        ]);
      } while (assetResponse.hasNextPage);

      onAllImagesLoaded && onAllImagesLoaded(loadedImages);
    }

    batchLoadImages();
  }, [permissionResponse]);

  useEffect(() => {
    setLoadedAssets((prev) => [...prev]);
  }, [hidden]);

  useEffect(() => {
    setLoadedAssets((prev) => [...prev]);
    if (multiSelect || loadedAssets.length == 0) return;

    updateSelectedImages({ images: [], indexedImages: {} });
  }, [multiSelect]);

  useEffect(() => {
    if (!albumId) {
      setLoadedAssets((prev) => [
        ...prev.map((x) => ({ ...x, hidden: false })),
      ]);
      return;
    }

    setLoadedAssets((prev) => [
      ...prev.map((x) => ({
        ...x,
        hidden: albumId ? x.albumId != albumId : false,
      })),
    ]);
  }, [albumId]);

  const handleOpenAppSettins = useCallback(() => {
    Linking.openSettings();
  }, []);

  const handleLimitedAccessModification = useCallback(async () => {
    await requestPermissionsAsync();
  }, []);

  const handleItemPress = useCallback(
    (image: MediaLibrary.Asset) => {
      setMultiSelect((prevMulti) => {
        updateSelectedImages((prev) => {
          const isSelected = prev.indexedImages[image.id] != undefined;
          if (prevMulti) {
            if (isSelected) {
              onImageDeselected && onImageDeselected(image);
              delete prev.indexedImages[image.id];
              return {
                images: [...prev.images.filter((x) => x.id != image.id)],
                indexedImages: { ...prev.indexedImages },
              };
            }

            if (
              maxSelectedImages &&
              prev.images.length + 1 > maxSelectedImages
            ) {
              alert(`You can only select ${maxSelectedImages} images`);
              return prev;
            }

            const newSelected: ImageInfo = {
              id: image.id,
              uri: image.uri,
              aspectRatio: image.width / image.height,
              height: image.height,
              width: image.width,
            };
            prev.images.push(newSelected);
            prev.indexedImages[image.id] = newSelected;

            onImageSelected && onImageSelected(image);
            return {
              images: [...prev.images],
              indexedImages: { ...prev.indexedImages },
            };
          }

          if (onImageDeselected && prev.images.length > 0)
            onImageDeselected(image);

          const newSelected: ImageInfo = {
            id: image.id,
            uri: image.uri,
            aspectRatio: image.width / image.height,
            height: image.height,
            width: image.width,
          };

          const indexed: IndexedImages = {};
          indexed[image.id] = newSelected;

          onImageSelected && onImageSelected(image);
          return { images: [newSelected], indexedImages: indexed };
        });

        return prevMulti;
      });

      setLoadedAssets((prev) => [...prev]);
    },
    [
      multiSelect,
      updateSelectedImages,
      maxSelectedImages,
      onImageSelected,
      onImageDeselected,
    ]
  );

  const toggleMultiselect = useCallback(
    (image?: MediaLibrary.Asset) => {
      setMultiSelect((prev) => {
        if (image) handleItemPress(image);

        setLoadedAssets((prev) => [...prev]);
        return !prev;
      });
    },
    [setMultiSelect, updateSelectedImages]
  );

  // The permission modal is shown
  if (!permissionResponse) return <></>;

  // The permissions were not granted
  if (!permissionResponse.granted) {
    const handlePermissions = async () => {
      if (permissionResponse.canAskAgain) {
        requestPermissionsAsync();
        return;
      }

      await Linking.openSettings();
      console.log("App running");
    };

    return (
      <FillingView className="justify-center items-center flex">
        <View className="w-2/3 gap-y-5">
          <Ionicons
            name="images-outline"
            className="w-full text-center"
            size={48}
            color={Colors[Theme]["text-primary"]}
          />
          <View className="gap-y-2">
            <Text className="text-text-primary text-center">
              To display your images you need to provide us access to them.
            </Text>
            {!permissionResponse.canAskAgain && (
              <Text className="text-text-third text-center">
                As we cannot request permission from you again, you will be
                redirected to settings
              </Text>
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            className="bg-text-primary items-center justify-center py-5 rounded-md"
            onPress={handlePermissions}
          >
            <Text className="text-text-inverted font-inter-bold">
              {permissionResponse.canAskAgain
                ? "Allow image access"
                : "Go to settings"}
            </Text>
          </TouchableOpacity>
        </View>
      </FillingView>
    );
  }

  return (
    <FillingView>
      {permissionResponse.accessPrivileges == "limited" && (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleLimitedAccessModification}
          className="bg-blue-600 flex-row items-center px-5 gap-x-5"
        >
          <AntDesign
            name="infocirlceo"
            size={20}
            color={Colors[Theme]["text-primary"]}
            style={{ width: 20 }}
          />
          <View className="text-text-primary flex-row align-middle justify-between grow items-center">
            <Text className="text-text-primary font-inter-light text-sm">
              Limited access.
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleOpenAppSettins}
              className="h-full py-3 px-6"
            >
              <Text className="text-text-primary font-inter-light underline text-sm">
                Allow access to other images
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
      <FlashList
        data={showedItems}
        estimatedItemSize={imageHeight}
        estimatedListSize={estimatedListSize}
        numColumns={columnNumber}
        scrollEnabled
        keyExtractor={(x) => x.id}
        renderItem={
          overrideRenderItem ??
          ((x) => {
            const isSelected = selectedIndexedImages[x.item.id] != undefined;
            return (
              <GalleryGridItem
                onLongPress={toggleMultiselect}
                selectedIndex={
                  isSelected
                    ? selectedImages.findIndex((y) => y.id == x.item.id) + 1
                    : undefined
                }
                onPress={handleItemPress}
                isSelected={isSelected}
                showMultiselect={multiSelect}
                image={x.item}
                imageHeight={imageHeight}
                imageWidth={imageWidth}
                columns={columnNumber}
                dimensions={windowDimensions}
                recyclingKey={x.item.id}
              />
            );
          })
        }
      />
    </FillingView>
  );
}
