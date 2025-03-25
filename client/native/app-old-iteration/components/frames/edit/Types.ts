import { ImageInfo } from "@/contexts/images/NewSelectedImageContext"
import { ShallowUserInfo } from "@/managers/user/Exports"
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'

export interface Position2D {
    positionX: number,
    positionY: number
}

export interface UserTagInfo {
    position: Position2D
    user: ShallowUserInfo
}

export interface UserTagPositionEvent {
    current: Position2D
    absolute: Position2D
    user?: ShallowUserInfo
    index?: number
}

const cropSize = { height: 2400, width: 1080 }
export async function processImage(image: ImageInfo): Promise<ImageInfo> {
    const aspectRatio = (image.width / image.height);
    const imageResizedWidth = cropSize.height * aspectRatio;
    const imageResizedHeight = cropSize.width * aspectRatio;

    const manipulations: ImageManipulator.Action[] = []

    const widthBigger = imageResizedWidth > cropSize.width;
    const heightBigger = image.height > cropSize.height;
    if (widthBigger) {
        manipulations.push({
            resize: { height: cropSize.height }
        })
        manipulations.push({
            crop: {
                originX: Math.max(0, (imageResizedWidth - cropSize.width) / 2), originY: 0,
                width: cropSize.width, height: cropSize.height
            }
        })
    }
    else if (heightBigger) {
        manipulations.push({
            resize: { width: cropSize.width }
        })
        manipulations.push({
            crop: {
                originX: 0, originY: Math.max(0, (imageResizedHeight - cropSize.height) / 2),
                width: cropSize.width, height: cropSize.height
            }
        })
    }

    try {
        const newImage = await ImageManipulator.manipulateAsync(image.uri, [...manipulations], {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG
        });

        console.log("New", newImage.height, "x", newImage.width)
        //@ts-ignore
        console.log(((await FileSystem.getInfoAsync(newImage.uri)).size / 1e+6) + "MB")

        image.edited = { id: image.id, uri: newImage.uri, height: newImage.height, width: newImage.width, aspectRatio: newImage.width / newImage.height }
        return image
    } catch (e) { console.error(e) }
    return image;
}