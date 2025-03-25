import AppBackgroundBase from "@/components/background/AppBackgroundBase";
import AudioIcon from "@/components/icons/AudioIcon";
import CameraIcon from "@/components/icons/CameraIcon";
import VideoIcon from "@/components/icons/VideoIcon";
import { Colors, Theme } from "@/constants/Colors";
import { Href, Link, router } from "expo-router";
import { Text, TouchableOpacity, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import Svg, { Circle } from "react-native-svg";
import { FlatList } from "react-native-gesture-handler";

const categories = [
    {
        title: "Audio",
        icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-primary"]} strokeWidth={4} />,
        modes: [
            {
                title: "Podcasts",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/audio/podcast"
            },
            {
                title: "Tracks",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/audio/track"
            },
        ]
    },
    {
        title: "Images",
        icon: <CameraIcon height="35" width="65" fill={Colors[Theme]["text-primary"]} />,
        modes: [
            {
                title: "Frames",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/images/frame"
            },
            {
                title: "Full Frames",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/images/full-frame"
            }
        ]
    },
    {
        title: "Videos",
        icon: <VideoIcon height="30" width="65" fill={Colors[Theme]["text-primary"]} />,
        modes: [
            {
                title: "Takes",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/video/takes"
            },
            {
                title: "Videos",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/video/long"
            },
        ]
    },
    {
        title: "Live",
        icon: <Svg height={30} width={40} viewBox="0 0 1 1" className="pb-2"><Circle r={.5} x={.5} y={.5} fill='red' /></Svg>,
        modes: [
            {
                title: "Live Takes",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/live/takes"
            },
            {
                title: "Streams",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/live/stream"
            },
        ]
    },
    {
        title: "Text",
        icon: <Text className="text-text-primary font-inter-bold text-2xl">T</Text>,
        modes: [
            {
                title: "Polls",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/text/poll"
            },
            {
                title: "Discussions",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/text/discussion"
            },
            {
                title: "Blogs / News",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/text/blog"
            },
            {
                title: "Quotes",
                icon: <AudioIcon height="40" width="65" fill={Colors[Theme]["text-secondary"]} />,
                href: "/app/create/text/quore"
            },
        ]
    },
]

export default function Index() {
    return <AppBackgroundBase className="px-9">
        <FlatList
            data={categories}
            showsVerticalScrollIndicator={false}
            className="gap-y-12"
            contentContainerClassName="pt-10 pb-36 gap-12"
            keyExtractor={x => x.title}
            renderItem={x =>
                <View>
                    <View className="flex flex-row align-middle items-center">
                        {x.item.icon}
                        <Text className="text-text-primary font-inter-bold text-xl align-middles ml-3">{x.item.title}</Text>
                    </View>

                    <FlatList
                        data={x.item.modes}
                        numColumns={2}
                        columnWrapperClassName="gap-x-5"
                        className="w-full mt-5"
                        contentContainerClassName="gap-y-5"
                        keyExtractor={y => y.title}
                        renderItem={y =>
                            <TouchableOpacity onPress={() => router.push(y.item.href as Href)} className="flex grow rounded-md py-5 justify-center items-center bg-bg-slim flex-1 w-full">
                                {y.item.icon}
                                <Text className="text-text-primary font-inter-bold text-lg align-middles">{y.item.title}</Text>
                            </TouchableOpacity>
                        }
                    />
                </View>
            }
        />
    </AppBackgroundBase>
}