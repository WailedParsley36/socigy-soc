import { createRef, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  Linking,
  TouchableOpacity,
  Dimensions,
  Permission,
  AppState,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";
import React from "react";
import { useIsFocused } from "@react-navigation/native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { BackButton } from "../navigation/BackButton";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import {
  ImageInfo,
  IndexedImages,
} from "@/contexts/images/NewSelectedImageContext";
import {
  Camera,
  Camera as NativeCamera,
  CameraPermissionStatus,
  useCameraDevice,
  useCameraFormat,
  PhotoFile,
} from "react-native-vision-camera";
import FillingView from "../FillingView";
import Feather from "@expo/vector-icons/Feather";
import { Colors, Theme } from "@/constants/Colors";

interface ImageLabel {
  confidence: number;
  label: string;
}

const singleImagePreviewProps = {
  buttonTitles: ["Delete", "Another", "Done"],
};

interface Props {
  className?: string;
  hidden?: boolean;
  selectedImages: ImageInfo[];
  selectedIndexedImages: IndexedImages;
  updateSelectedImages: React.Dispatch<
    React.SetStateAction<{
      images: ImageInfo[];
      indexedImages: IndexedImages;
    }>
  >;
}

export default function CameraImageTaker({
  hidden,
  className,
  updateSelectedImages,
}: Props) {
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [cameraFlash, setCameraFlash] = useState<"auto" | "on" | "off">("auto");
  const [preferredFps, setPreferredFps] = useState<number>(240);

  // const [imageData, setImageData] = useState<ImageLabel[]>([]);
  const [takenPhotos, setTakenPhotos] = useState<PhotoFile[]>([]);

  const [imagePreviewProps, setImagePreviewProps] = useState(
    singleImagePreviewProps
  );
  const [photoPreview, setPhotoPreview] = useState<PhotoFile>();

  const [permission, setPermission] = useState<
    CameraPermissionStatus | "denied-settings"
  >(NativeCamera.getCameraPermissionStatus());
  const cameraDevice = useCameraDevice(cameraFacing, {
    physicalDevices: [
      "ultra-wide-angle-camera",
      "wide-angle-camera",
      "telephoto-camera",
    ],
  });
  const format = useCameraFormat(cameraDevice, [{ fps: preferredFps }]);
  const camera = useRef<Camera>(null);

  const isFocused = useIsFocused();
  const appState = AppState.currentState;
  const isActive = isFocused && appState === "active" && !photoPreview;

  useEffect(() => {
    setPhotoPreview(undefined);
    setTakenPhotos([]);
  }, [hidden]);

  useEffect(() => {
    if (permission == "granted") return;

    const fetchedPermission = Camera.getCameraPermissionStatus();
    if (fetchedPermission == "granted") {
      setPermission("granted");
    }
  }, [permission]);

  const handlePermissionRequest = async () => {
    const fetchedPermission = Camera.getCameraPermissionStatus();
    if (fetchedPermission == "granted") {
      setPermission("granted");
      return true;
    }

    if (permission == "denied-settings") {
      Linking.openSettings();
      return false;
    }

    const permissionResult = await Camera.requestCameraPermission();
    if (permission == "denied" && permission == "denied")
      setPermission("denied-settings");
    else setPermission(permissionResult);
    if (permissionResult == "granted") return true;

    return false;
  };

  if (hidden) return undefined;
  else if (permission != "granted" || !cameraDevice) {
    // Camera permissions are not granted yet.
    return (
      <FillingView className="justify-center items-center flex">
        <View className="w-2/3 gap-y-5">
          <Feather
            name="camera"
            className="w-full text-center"
            size={48}
            color={Colors[Theme]["text-primary"]}
          />
          <View className="gap-y-2">
            <Text className="text-text-primary text-center">
              To display your images you need to provide us access to them.
            </Text>
            {permission == "denied-settings" && (
              <Text className="text-text-third text-center">
                As we cannot request permission from you again, you will be
                redirected to settings
              </Text>
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            className="bg-text-primary items-center justify-center py-5 rounded-md"
            onPress={handlePermissionRequest}
          >
            <Text className="text-text-inverted font-inter-bold">
              {permission != "denied-settings"
                ? "Allow Camera access"
                : "Go to settings"}
            </Text>
          </TouchableOpacity>
        </View>
      </FillingView>
    );
  }

  const handleFacingToggle = async () => {
    setCameraFacing((prev) => (prev == "back" ? "front" : "back"));
  };

  const handleFirst = (
    image: PhotoFile,
    all: PhotoFile[],
    deleted: boolean = false
  ) => {
    const previousIndex = all.findIndex((x) => x.path == image.path) - 1;
    if (previousIndex < 0) return false;

    setPhotoPreview(all[previousIndex]);
    setImagePreviewProps((prev) => ({
      ...prev,
      buttonClassNames: [
        previousIndex == 0 ? "hidden" : "",
        "",
        "",
        all.length - (deleted ? 2 : 1) > previousIndex ? "" : "hidden",
      ],
    }));
  };

  const handleFourth = (
    image: PhotoFile,
    all: PhotoFile[],
    deleted: boolean = false
  ) => {
    const nextIndex = all.findIndex((x) => x.path == image.path) + 1;
    if (nextIndex > all.length - 1) return false;

    setPhotoPreview(all[nextIndex]);
    setImagePreviewProps((prev) => ({
      ...prev,
      buttonClassNames: [
        nextIndex - (deleted ? 2 : 1) < 0 ? "hidden" : "",
        "",
        "",
        nextIndex - (deleted ? 1 : 0) >= all.length - (deleted ? 2 : 1)
          ? "hidden"
          : "",
      ],
    }));
  };

  const handleContinue = (taken?: any[]) => {
    const takenImages = taken ?? takenPhotos;
    if (!takenImages) {
      setTakenPhotos([]);
      setPhotoPreview(undefined);
      return;
    }

    const indexed: IndexedImages = {};
    const array: ImageInfo[] = [];

    (taken ?? takenPhotos)?.forEach((photo) => {
      const newItem: ImageInfo = {
        id: photo.path,
        uri: "file://" + photo.path,
        aspectRatio: photo.width / photo.height,
        height: photo.height,
        width: photo.width,
      };
      indexed[photo.path] = newItem;
      array.push(newItem);
    });
    updateSelectedImages({ images: array, indexedImages: indexed });
    router.navigate("/app/create/images/full-frame/edit");
  };

  return (
    <View
      className={clsx(hidden && "hidden", className, "")}
      style={{ height: Dimensions.get("screen").height }}
    >
      <View className="absolute top-12 z-10 pr-8 flex-row justify-between items-center w-full align-middle">
        <BackButton
          fallbackRoute={"/app/create"}
          height="40"
          width="65"
          strokeWidth={2}
        />
        {takenPhotos.length > 0 && (
          <TouchableOpacity
            className="bg-bg-ultraslim px-4 py-2 rounded-full align-middle"
            activeOpacity={0.75}
            onPress={() => handleContinue()}
          >
            <Text className="text-text-primary font-inter-bold text-2xl">
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="absolute bottom-32 flex-row z-10 align-middle w-full items-center justify-center px-10">
        <View>
          <TouchableOpacity
            activeOpacity={0.75}
            onLongPress={() => {
              setPhotoPreview(undefined);
              takenPhotos.forEach(async (x) => {
                await FileSystem.deleteAsync(x.path);
              });
              setTakenPhotos([]);
            }}
            onPress={() => {
              if (takenPhotos.length == 0) return;

              setPhotoPreview(takenPhotos[takenPhotos.length - 1]);
              setImagePreviewProps({
                buttonTitles: ["← Previous", "X", "Delete", "Next →"],
                onFirst: handleFirst,
                onSecond: () => {
                  setPhotoPreview(undefined);
                  setImagePreviewProps(singleImagePreviewProps);
                },
                onThird: async (image: PhotoFile, all: PhotoFile[]) => {
                  await FileSystem.deleteAsync("file://" + image.path);
                  const updated = [...all.filter((x) => x.path != image.path)];

                  if (handleFirst(image, all, true) == false) {
                    if (handleFourth(image, all, true) == false) {
                      setTakenPhotos(updated);
                      setPhotoPreview(undefined);
                      setImagePreviewProps(singleImagePreviewProps);
                      return;
                    }
                  }

                  setTakenPhotos(updated);
                },
                onFourth: handleFourth,
                buttonClassNames: [
                  takenPhotos.length > 1 ? "" : "hidden",
                  "",
                  "",
                  "hidden",
                ],
              });
            }}
            style={{ height: 60, width: 60 }}
            className="relative border-2 border-white rounded-lg flex justify-center items-center"
          >
            {takenPhotos.length > 0 && (
              <View className="absolute border-2 border-text-secondary rounded-lg">
                <View className="absolute inset-0 bg-black/40 z-10 rounded-lg" />
                <Image
                  source={{
                    uri: "file://" + takenPhotos[takenPhotos.length - 1].path,
                  }}
                  style={{ borderRadius: 8, height: 60, width: 60 }}
                />
              </View>
            )}
            {takenPhotos.length > 0 && (
              <Text className="text-center text-text-inverted font-inter-medium text-xl bg-text-third px-2 rounded-full z-10">
                {takenPhotos.length}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View className="px-12 justify-center items-center">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={async () => {
              const newPhoto = await camera.current!.takePhoto();
              const loadedPhoto = await Image.loadAsync(
                "file://" + newPhoto.path
              );
              newPhoto.height = loadedPhoto.height;
              newPhoto.width = loadedPhoto.width;
              setPhotoPreview(newPhoto);
            }}
          >
            <Svg width={100} height={100} viewBox="0 0 83 83" fill="none">
              <Rect
                x="12.7534"
                y="12.7539"
                width="57.3909"
                height="56.7532"
                rx="28.3766"
                fill="white"
              />
              <Path
                fill="white"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M41.1301 0C18.4146 0 0 18.4146 0 41.1301C0 63.8457 18.4146 82.2603 41.1301 82.2603C63.8457 82.2603 82.2603 63.8457 82.2603 41.1301C82.2603 18.4146 63.8457 0 41.1301 0ZM41.1301 6.37676C21.9364 6.37676 6.37676 21.9364 6.37676 41.1301C6.37676 60.3239 21.9364 75.8835 41.1301 75.8835C60.3239 75.8835 75.8835 60.3239 75.8835 41.1301C75.8835 21.9364 60.3239 6.37676 41.1301 6.37676Z"
              />
            </Svg>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity activeOpacity={0.75} onPress={handleFacingToggle}>
            <Feather name="repeat" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {photoPreview && (
        <ImagePreview
          photo={photoPreview}
          takenPhotos={takenPhotos}
          className="absolute inset-0 z-20"
          onThird={() => {
            handleContinue([...takenPhotos, photoPreview]);
          }}
          onSecond={() => {
            if (takenPhotos.length >= 10) {
              alert("Maximum of 10 images is allowed per post");
              return;
            }
            setTakenPhotos([...takenPhotos, photoPreview]);
            setPhotoPreview(undefined);
          }}
          onFirst={async () => {
            await FileSystem.deleteAsync("file://" + photoPreview.path);
            setPhotoPreview(undefined);
          }}
          {...imagePreviewProps}
        />
      )}
      <View className="flex-1">
        {/* {imageData.length > 0 &&
                    <View className="absolute top-32 inset-x-0 z-10 justify-center items-center">
                        <Text className="text-text-primary text-3xl">{imageData[0].label}</Text>
                        <Text className="text-text-third">{imageData[0].confidence * 100}%</Text>
                    </View>
                } */}

        <Camera
          ref={camera}
          style={{ flex: 1 }}
          format={format}
          device={cameraDevice}
          isActive={isActive}
          // options={{ minConfidence: 0.7 }}
          // callback={(d) => setImageData(d)}
          photo
          photoHdr
          fps={[format!.minFps, format!.maxFps]}
        />
      </View>
    </View>
  );
}

function CameraPermissionLoading({ className }: any) {
  return (
    <SafeAreaView
      className={clsx(className, "flex-1 justify-center items-center")}
    >
      <Text className="text-text-primary">Camera permission is loading</Text>
    </SafeAreaView>
  );
}

interface ImagePreviewProps {
  onFirst: (image?: PhotoFile, all?: PhotoFile[]) => void;
  onSecond: (image?: PhotoFile, all?: PhotoFile[]) => void;
  onThird: (image?: PhotoFile, all?: PhotoFile[]) => void;
  onFourth?: (image?: PhotoFile, all?: PhotoFile[]) => void;

  photo: PhotoFile;
  takenPhotos?: PhotoFile[];
  buttonTitles: string[];
  buttonClassNames?: string[];
  className?: string;
}

function ImagePreview({
  photo,
  className,
  onFirst,
  onThird,
  onFourth,
  onSecond,
  buttonTitles,
  takenPhotos,
  buttonClassNames = ["", "", ""],
}: ImagePreviewProps) {
  const windowDimensions = Dimensions.get("screen");
  const foundIndex = takenPhotos?.findIndex((x) => x.path == photo.path) ?? -1;

  return (
    <View className={clsx(className, "bg-bg-default")}>
      {foundIndex >= 0 && (
        <View className="absolute top-14 px-10 flex-row flex w-full justify-center items-center z-10">
          <Text className="text-text-primary text-3xl py-2 px-4 bg-bg-slim rounded-full">
            {foundIndex + 1}
          </Text>
        </View>
      )}
      <Image
        source={{ uri: "file://" + photo.path }}
        style={{
          height: windowDimensions.height,
          width: windowDimensions.width,
        }}
      />
      <View className="absolute bottom-12 px-10 flex-row flex w-full justify-center items-center gap-x-5">
        <TouchableOpacity
          className={clsx(
            buttonClassNames[0],
            "bg-text-primary px-5 py-2 rounded-lg"
          )}
          onPress={() => onFirst(photo, takenPhotos)}
        >
          <Text className="text-text-inverted font-inter-bold text-lg">
            {buttonTitles[0]}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={clsx(
            buttonClassNames[1],
            "bg-text-primary px-5 py-2 rounded-lg"
          )}
          onPress={() => onSecond(photo, takenPhotos)}
        >
          <Text className="text-text-inverted font-inter-bold text-lg">
            {buttonTitles[1]}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={clsx(
            buttonClassNames[2],
            "bg-text-primary px-5 py-2 rounded-lg"
          )}
          onPress={() => onThird(photo, takenPhotos)}
        >
          <Text className="text-text-inverted font-inter-bold text-lg">
            {buttonTitles[2]}
          </Text>
        </TouchableOpacity>
        {onFourth && (
          <TouchableOpacity
            className={clsx(
              buttonClassNames[3],
              "bg-text-primary px-5 py-2 rounded-lg"
            )}
            onPress={() => onFourth(photo, takenPhotos)}
          >
            <Text className="text-text-inverted font-inter-bold text-lg">
              {buttonTitles[3]}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
