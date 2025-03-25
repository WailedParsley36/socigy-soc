import AppBackgroundBase from '@/components/background/AppBackgroundBase'
import React, { useCallback, useEffect, useState } from 'react'
import { router, useNavigation } from 'expo-router';
import { FlatList } from 'react-native';
import useSelectedImages, { ImageInfo } from '@/contexts/images/NewSelectedImageContext';
import { BackButton } from '@/components/navigation/BackButton';
import { useDimensions } from '@/hooks/useDimensions';
import * as FileSystem from 'expo-file-system'
import useKeyboardVisibility from '@/hooks/useKeyboardVisibility';
import { usePreventRemove } from '@react-navigation/native';
import { processImage, UserTagInfo, UserTagPositionEvent } from '@/components/frames/edit/Types';
import FullFrameEditButtons from '@/components/frames/edit/FullFrameEditButtons';
import FullFrameImageItem from '@/components/frames/edit/FullFrameImageItem';
import UserSearchPanel from '@/components/frames/edit/UserSearchPanel';
import DoneButton from '@/components/frames/edit/DoneButton';

// TODO: ~ Send users friend requests and manage relationships
// TODO: List the posts
// TODO: Sign in with QR using react-native-vision-camera in profile section
// TODO: Notifications

// !MATURITA DONE!

export default function FullFrameEdit() {
    // States
    const { images, indexedImages, update } = useSelectedImages();
    const [uiHidden, setUiHidden] = useState<boolean>(false);
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [userTagEditEnabled, setUserTagEnabled] = useState<boolean>(false)
    const [userTags, setUserTags] = useState<UserTagPositionEvent[][]>(Array(images.length).fill([]))
    const [tempUserTag, setTempUserTag] = useState<UserTagPositionEvent>()

    // Hooks
    const screenDimensions = useDimensions('screen')
    const keyboardVisible = useKeyboardVisibility();
    const navigation = useNavigation();

    usePreventRemove(isSearchVisible, ({ data }) => {
        if (isSearchVisible)
            setIsSearchVisible(false)
        else
            navigation.dispatch(data.action)
    })

    // Effects
    useEffect(() => {
        async function processImages(imagesForProcessing: { image: ImageInfo, index: number }[]) {
            for (let i = 0; i < imagesForProcessing.length; i++) {
                await processImageAsync(imagesForProcessing[i].image, imagesForProcessing[i].index)
            }
        }

        async function processImageAsync(image: ImageInfo, index: number) {
            const editedImage = await processImage(image);
            images[index] = editedImage
            indexedImages[image.id] = editedImage
            update(prev => ({ images: [...images], indexedImages: { ...indexedImages } }))
        }

        let largeImages: { image: ImageInfo, index: number }[] = []
        images.forEach((x, index) => {
            if (x.edited)
                return;

            if (x.height * x.width > 25000000) // 5000x5000 resolution
            {
                largeImages.push({ image: x, index: index })
                return;
            }

            new Promise(async () => {
                await processImageAsync(x, index)
            })
        })

        processImages(largeImages)

        return () => {
            async function deleteImages() {
                for (let i = 0; i < images.length; i++) {
                    const x = images[i];
                    if (!x || !x.edited)
                        continue;

                    await FileSystem.deleteAsync(x.edited.uri, { idempotent: true });
                    delete images[i].edited
                    delete indexedImages[images[i].id].edited
                }

                update({ images: [...images], indexedImages: { ...indexedImages } })
            }

            deleteImages();
        }
    }, [])

    // Callbacks
    const toggleUiHide = useCallback(() => {
        setUiHidden(prev => !prev)
    }, [])
    const toggleUserTagEnabled = useCallback(() => {
        setUserTagEnabled(prev => !prev);
    }, [])

    const handleUpdateUserTagsForItem = useCallback((index: number, newTags: UserTagPositionEvent[]) => {
        userTags[index] = [...newTags];
        setUserTags([...userTags])
    }, [images, userTags])

    const handleContinue = useCallback(() => {
        images.forEach((x, index) => {
            const transformed = userTags[index].map(x => ({ ...x, position: x.absolute, absolute: undefined, current: undefined }) as UserTagInfo);
            images[index].userTags = [...transformed];
            indexedImages[images[index].id].userTags = [...transformed]
        })
        update({ images: [...images], indexedImages: { ...indexedImages } })

        router.push("/app/create/images/full-frame/complete")
    }, [userTags, images])

    return <AppBackgroundBase isSafe={false}>
        <FullFrameEditButtons hidden={keyboardVisible || isSearchVisible} userTagEnabled={userTagEditEnabled} onlyUiHide={uiHidden} onUIHideToggle={toggleUiHide} onUserTagToggle={toggleUserTagEnabled}>
            <BackButton fallbackRoute='/app/create/images/full-frame' height='40' width='65' />
        </FullFrameEditButtons>

        <FlatList
            data={images}
            horizontal
            removeClippedSubviews
            pagingEnabled
            scrollEnabled={!userTagEditEnabled}
            keyExtractor={(x, index) => x?.id ?? index.toString()}
            renderItem={x => <FullFrameImageItem index={x.index} hideUI={uiHidden} tempUserTag={tempUserTag} updateTempUserTag={setTempUserTag} image={x.item} userTags={userTags[x.index]} userTagEditEnabled={userTagEditEnabled} updateUserTags={(tags) => handleUpdateUserTagsForItem(x.index, tags)} dimensions={screenDimensions} />}
        />

        <UserSearchPanel isVisible={isSearchVisible} updateVisibility={setIsSearchVisible} hidden={!userTagEditEnabled || !tempUserTag} fullHeight={screenDimensions.height} keyboardVisible={keyboardVisible} updateTempUserTag={setTempUserTag} />
        <DoneButton disabled={!images.every(x => x.edited)} hidden={userTagEditEnabled || uiHidden} onPress={handleContinue} />
    </AppBackgroundBase>
}