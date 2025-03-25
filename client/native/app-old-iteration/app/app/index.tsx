import AppBackgroundBase from "@/components/background/AppBackgroundBase";
import { FullFramePost } from "@/data/api/responses/posts/FullFramePost";
import { useAuth, useContentManager } from "@/managers/Exports";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { FlatList, TouchableOpacity } from "react-native-gesture-handler";
import { View, Text, Button, Platform } from "react-native";
import { useDimensions } from "@/hooks/useDimensions";
import Feather from "@expo/vector-icons/Feather";
import { Colors, Theme } from "@/constants/Colors";
import Octicons from '@expo/vector-icons/Octicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostInteractionType } from "@/data/content/PostInteraction";
import { Guid } from "expo-passkeys/build/ExpoPasskeys.types";

export default function AppHome() {
    // Hooks
    const contentManager = useContentManager();

    // States
    const [loadedFullFrames, setLoadedFullFrames] = useState<FullFramePost[]>(undefined!);
    const screenDimensions = useDimensions('screen');

    // Callbacks
    const handleFullFramesEndReached = useCallback(async (e?: any) => {
        const loadedPosts = (await contentManager.getPostRecommendations()).result;
        setLoadedFullFrames(loadedPosts as FullFramePost[])

        if (loadedPosts)
            await contentManager.batchViewPosts(loadedPosts.map(x => x.id))
    }, [loadedFullFrames])

    const handlePostInteraction = useCallback(async (type: PostInteractionType, id: Guid) => {
        const response = await contentManager.interactWithPost(type, id);
        if (response)
            console.error("Failed to interact with post:", response);
    }, [contentManager])

    // Effects
    useEffect(() => {
        if (loadedFullFrames == undefined) {
            setLoadedFullFrames([]);
            handleFullFramesEndReached();
        }
    }, [])


    return <AppBackgroundBase className="pt-10" additionalScrollViewProps={{ contentContainerClassName: "flex-1 pb-40 text-center mx-auto" }}>
        <FlatList
            contentContainerClassName="pb-32"
            data={loadedFullFrames}
            ItemSeparatorComponent={() => <View style={{ height: 30 }} />}
            renderItem={x => {
                if (x.item)
                    return (<View className="relative">
                        <View className="absolute inset-0 z-20">
                            <View className='bg-level-1/50 py-3 px-6 flex-row flex items-center gap-x-5 rounded-t'>
                                {x.item.owner.iconUrl ?
                                    <Image source={{ uri: x.item.owner.iconUrl }} className='my-auto mr-4' style={{ borderRadius: 25, height: 40, width: 40 }} />
                                    :
                                    <Feather name='user' size={40} color={Colors[Theme]['text-primary']} />
                                }
                                <View>
                                    <Text className='text-text-third'>#{x.item.owner.tag}</Text>
                                    <Text className='text-text-primary'>{x.item.owner.username}</Text>
                                </View>
                            </View>
                        </View>

                        <FlatList
                            data={x.item.attachments}
                            pagingEnabled={Platform.select({ web: false, default: true })}
                            horizontal
                            renderItem={y => <Image source={y.item.url} style={{ height: 600, width: screenDimensions.width }} />}
                        />

                        <View style={{ paddingHorizontal: 32 }} className="flex-row justify-start py-3 gap-x-10 text-left items-center w-full">
                            <View className="flex flex-row items-center gap-x-3">
                                <Feather name="eye" size={24} color={Colors[Theme].foreground} />
                                <Text className="text-foreground">{x.item.views + 1}</Text>
                            </View>

                            <TouchableOpacity onPress={() => handlePostInteraction(PostInteractionType.Like, x.item.id)}>
                                <View className="flex flex-row items-center gap-x-3">
                                    <Feather name="heart" size={24} color={Colors[Theme].foreground} />
                                    <Text className="text-foreground">{x.item.likes}</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handlePostInteraction(PostInteractionType.Dislike, x.item.id)}>
                                <View className="flex flex-row gap-x-3 items-center">
                                    <Octicons name="thumbsdown" size={24} color={Colors[Theme].foreground} />
                                    <Text className="text-foreground">{x.item.dislikes}</Text>
                                </View>
                            </TouchableOpacity>

                            <View className="flex flex-row gap-x-3 items-center">
                                <FontAwesome5 name="comment" size={24} color={Colors[Theme].foreground} />
                                <Text className="text-foreground">0</Text>
                            </View>
                        </View>
                    </View>)

                else
                    return (<View className="flex justify-center items-center w-full gap-y-5 my-24">
                        <Ionicons className="text-center p-2 border-2 border-foreground rounded-full" name="refresh" size={40} color={Colors[Theme].foreground} />
                        <Text className="text-foreground text-center text-lg">No more content found 🤷‍♂️</Text>
                    </View>)
            }}
        />

        <Button title="Refresh Posts" onPress={handleFullFramesEndReached} />
    </AppBackgroundBase>
}