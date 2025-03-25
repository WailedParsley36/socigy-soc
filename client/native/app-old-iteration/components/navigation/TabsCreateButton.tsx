import { Colors, Theme } from "@/constants/Colors";
import { PlatformPressable } from "@react-navigation/elements";
import { clsx } from "clsx";
import { TabInnerProps } from "./TabBar";
import { Dimensions, Text } from 'react-native'
import AntDesign from '@expo/vector-icons/AntDesign';
import ExpandableCircleButton from "./ExpandableCircleButton";
import { useState } from "react";
import AudioIcon from "../icons/AudioIcon";
import ImageIcon from "../icons/ImageIcon";
import VideoIcon from "../icons/VideoIcon";
import { Href, router } from "expo-router";

const routes: Href[] = ["/app/create/audio", "/app/create/frames", "/app/create/video", "/app/create/text"]

export default function CreateButton({ index, route, isFocused, options, onPress, onLongPress, navigation }: TabInnerProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const screen = Dimensions.get('screen');

    return <PlatformPressable
        key={index}
        accessibilityState={isFocused ? { selected: true } : {}}

        className='flex-1 justify-start align-top -mt-5 z-10 mx-4'
    >
        <ExpandableCircleButton
            radius={screen.width / 3}
            yOffset={-50}
            circleColors={["#D9D9D9", "#D9D9D9", "#D9D9D9", "#D9D9D9"]}
            circleRoutes={routes}

            mainSize={70}
            circleSize={80}

            mainCircleElement={
                <AntDesign name="plus" size={24} color={isFocused ? Colors[Theme]["text-primary"] : Colors[Theme]["text-third"]} className="text-center" />
            }

            circleElements={[
                <AudioIcon width="40" height="40" fill={Colors[Theme]["bg-ultraslim"]} strokeWidth={4} />,
                <ImageIcon width="40" height="40" fill={Colors[Theme]["bg-ultraslim"]} fillSecond={"none"} />,
                <VideoIcon width="40" height="40" fill={Colors[Theme]["bg-ultraslim"]} />,
                <Text className="font-inter-bold text-3xl">T</Text>
            ]}

            // TODO: Rework because of new usage of links already implemented (this is no longer needed...)
            onCirclePressed={() => { }}
            onOpenChanged={(value: boolean) => setIsOpen(value)}
            mainCirclePressed={() => {
                if (!isOpen) {
                    onPress()
                }
            }} />
    </PlatformPressable>
}