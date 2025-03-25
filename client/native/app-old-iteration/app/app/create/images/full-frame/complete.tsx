import AppBackgroundBase from '@/components/background/AppBackgroundBase';
import { BackButton } from '@/components/navigation/BackButton';
import { Colors, Theme } from '@/constants/Colors';
import useSelectedImages, { ImageInfo } from '@/contexts/images/NewSelectedImageContext';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TextInput,
    FlatList,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ColorValue,
} from 'react-native';
import { Image } from 'expo-image'
import { useDimensions } from '@/hooks/useDimensions';
import Feather from '@expo/vector-icons/Feather';
import clsx from 'clsx';
import useKeyboardVisibility from '@/hooks/useKeyboardVisibility';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FoundUserItem from '@/components/frames/edit/FoundUserItem';
import { useContentManager } from '@/managers/Exports';
import { ShallowUserInfo } from '@/managers/user/Exports';
import { PostCollaborator, PostLocation } from '@/managers/content/Exports';
import { Category } from '@/data/content/Category';
import { Interest } from '@/data/content/Interest';
import { router, useNavigation } from 'expo-router';

function hasFlag<T extends number>(flags: T, flagToCheck: T): boolean {
    return (flags & flagToCheck) === flagToCheck;
}

function getFlags(flags: PostVisibility): PostVisibility[] {
    const enumValues: PostVisibility[] = []

    for (const key in PostVisibility) {
        const numberKey = Number(key);
        if (isNaN(numberKey) || !hasFlag(flags, numberKey)) {
            continue; // Skip non-numeric keys
        }

        enumValues.push(numberKey)
    }

    return enumValues;
}

export enum PostVisibility {
    Public = 1,
    Unlisted = 2,
    Private = 4,
    Followers = 8,
    Subscription = 16, // TODO: List the subscriptions to select from
    Custom = 32
}

interface PostVisibilityMapping {
    visibility: PostVisibility,
    single: boolean
    icon: any
}

const postVisibilityValues: PostVisibilityMapping[] = [
    {
        visibility: PostVisibility.Public,
        single: true,
        icon: (color: ColorValue) => <MaterialIcons name="public" size={24} color={color} />
    },
    {
        visibility: PostVisibility.Private,
        single: true,
        icon: (color: ColorValue) => <Feather name="lock" size={24} color={color} />
    },
    {
        visibility: PostVisibility.Unlisted,
        single: false,
        icon: (color: ColorValue) => <Feather name="paperclip" size={24} color={color} />
    },
    {
        visibility: PostVisibility.Followers,
        single: false,
        icon: (color: ColorValue) => <Feather name="user-check" size={24} color={color} />
    },
    {
        visibility: PostVisibility.Subscription,
        single: false,
        icon: (color: ColorValue) => <FontAwesome name="dollar" size={24} color={color} />
    },
    {
        visibility: PostVisibility.Custom,
        single: false,
        icon: (color: ColorValue) => <Feather name="settings" size={24} color={color} />
    },
]

export default function NewPostScreen() {
    // Hooks
    const { images, indexedImages, update } = useSelectedImages();
    const screenDimensions = useDimensions('screen')
    const keyboardVisible = useKeyboardVisibility();
    const contentManager = useContentManager();
    const navigation = useNavigation();

    // States
    const [currentImage, setCurrentImage] = useState<ImageInfo>(images[0]);

    const [postVisibility, setPostVisibility] = useState<number>(PostVisibility.Public);
    const [description, setDescription] = useState('');
    const [collaborators, setCollaborators] = useState<PostCollaborator[]>()
    const [locations, setLocations] = useState<(PostLocation | undefined)[]>()
    const [location, setLocation] = useState<PostLocation>()
    const [posted, setPosted] = useState<(Date | undefined)>()
    const [imagesPosted, setImagesPosted] = useState<(Date | undefined)[]>()
    const [imageVisibility, setImageVisibility] = useState<PostVisibility[]>()

    const [specificCategories, setSpecificCategories] = useState<Category[][]>();
    const [categories, setCategories] = useState<Category[]>();

    const [specificInterests, setSpecificInterests] = useState<Interest[][]>();
    const [interests, setInterests] = useState<Interest[]>();

    const [error, setError] = useState<string>();

    // Values
    const hasTaggedUsers = useMemo(() => {
        if (!currentImage.userTags)
            return false;

        return currentImage.userTags.length > 0;
    }, [currentImage])

    const postVisibilityValue = useMemo(() => {
        const allFlags = getFlags(postVisibility)
        const dots = allFlags.length > 2 ? "..." : "";
        const joinedFlags = allFlags.splice(0, 2).map(x => PostVisibility[x]).join(', ')

        return joinedFlags + dots
    }, [postVisibility])
    const isCustomVisibility = useMemo(() => {
        return hasFlag(postVisibility, PostVisibility.Custom)
    }, [postVisibility])

    // Callbacks
    const handlePageChange = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setCurrentImage(images[Math.round(e.nativeEvent.contentOffset.x / screenDimensions.width)]);
    }, [screenDimensions])

    const handleDescriptionChange = useCallback((text: string) => {
        setDescription(text)
    }, [setDescription])

    const handleVisibilityClick = useCallback((value: { visibility: PostVisibility, single: boolean }) => {
        if (value.single)
            setPostVisibility(value.visibility)
        else {
            if (postVisibilityValues.filter(x => x.single).find(x => hasFlag(postVisibility, x.visibility)))
                setPostVisibility(value.visibility)
            else {
                const transformed = postVisibility ^ value.visibility;

                if (getFlags(transformed).length == 0)
                    setPostVisibility(PostVisibility.Public)
                else
                    setPostVisibility(transformed)
            }
        }
    }, [postVisibility, setPostVisibility])

    const handleContinue = useCallback(async () => {
        const result = await contentManager.shareFullFramePost({
            attachments: images,
            attachmentVisibilities: imageVisibility,
            attachmentsPosted: imagesPosted,
            visibility: postVisibility,
            location: location,

            description: description,
            collaborators: collaborators,
            userTags: images.map(x => x.userTags ?? []),
            locations: locations,
            posted: posted,

            categories: categories,
            specificCategories: specificCategories,
            interests: interests,
            specificInterests: specificInterests
        });
        if (result.error) {
            setError(result.error.message);
            return;
        }

        router.replace('/app/create/images/full-frame/posted')
    }, [description, postVisibility, images, collaborators, locations, posted, categories, specificCategories, interests, specificInterests])

    return (
        <AppBackgroundBase className='flex-1'>
            <View className='pt-3 flex-row flex items-center align-middle'>
                <BackButton height='40' width='65' color={Colors[Theme]['text-primary']} fallbackRoute='/app/create/images/full-frame/edit' />
                <Text className='text-text-primary ml-3 font-inter-semibold text-xl'>New Full Frame</Text>
            </View>

            <ScrollView className='pt-6 flex-1' contentContainerClassName='pb-40'>
                {/* Image Preview */}
                <View className='relative' style={{ height: 300 }}>
                    <FlatList
                        data={images}
                        showsHorizontalScrollIndicator={false}
                        horizontal
                        onMomentumScrollEnd={handlePageChange}
                        pagingEnabled
                        renderItem={x => <Image source={{ uri: x.item.edited!.uri }} allowDownscaling contentFit='contain' style={{ height: 300, width: screenDimensions.width }} />}
                    />
                </View>

                {/* Caption Input */}
                <TextInput
                    className='py-6 px-5 text-text-primary mt-5'
                    style={{
                        textAlignVertical: 'top'
                    }}
                    placeholder="Write a short caption to your post"
                    placeholderTextColor={Colors[Theme]['text-third']}
                    multiline
                    value={description}
                    onChangeText={handleDescriptionChange}
                />

                {/* Action Buttons */}
                <View style={styles.actionsList}>
                    <ListableItem
                        title='Add location'
                        icon={<Feather name="map-pin" size={24} color={Colors[Theme]['text-primary']} />}
                        canExpand={false}
                    >
                        <View className='h-24 bg-red-500' />
                        <View className='h-24 bg-blue-500' />
                        <View className='h-24 bg-green-500' />
                    </ListableItem>

                    <ListableItem
                        title='Tagged people'
                        canExpand={hasTaggedUsers}
                        icon={<Feather name="users" size={24} color={Colors[Theme]['text-primary']} />}
                        additionalText={hasTaggedUsers ? currentImage.userTags!.length.toString() : 'None'}
                    >
                        {currentImage.userTags?.map((x, index) => <FoundUserItem disabled className={clsx((index + 1 != currentImage.userTags!.length) && "border-b border-bg-ultraslim", 'bg-bg-default py-5')} key={index + x.user!.tag + x.user!.username} userInfo={x.user!} />)}
                        {isCustomVisibility && (
                            <View className='bg-red-500'>
                                <Text className='text-text-primary'>Ahoy</Text>
                            </View>
                        )}
                    </ListableItem>

                    <ListableItem
                        title='Post visibility'
                        icon={<Feather name="eye" size={24} color={Colors[Theme]['text-primary']} />}
                        additionalText={postVisibilityValue}
                    >
                        {postVisibilityValues.map((x, index) => {
                            const isSelected = hasFlag(postVisibility, x.visibility)

                            return (<TouchableOpacity key={x.visibility} onPress={() => handleVisibilityClick(x)} activeOpacity={.85} className={clsx((index + 1 != currentImage.userTags!.length) && "border-b border-bg-ultraslim", 'py-3 px-8 flex flex-row items-center gap-x-4')}>
                                {x.icon(isSelected ? Colors[Theme]['text-primary'] : Colors[Theme]['text-third'])}
                                <Text className={clsx(isSelected ? "text-text-primary" : "text-text-third", 'text-md')}>{PostVisibility[x.visibility]}</Text>
                            </TouchableOpacity>)
                        }
                        )}
                    </ListableItem>

                    <TouchableOpacity style={styles.actionItem}>
                        <Feather name="music" size={24} color={Colors[Theme]['text-secondary']} />
                        <Text style={styles.actionText}>Add music</Text>
                        <Feather name="chevron-down" size={24} color={Colors[Theme]['text-secondary']} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <FontAwesome name="handshake-o" size={24} color={Colors[Theme]['text-secondary']} />
                        <Text style={styles.actionText}>Collaborators</Text>
                        <Feather name="chevron-down" size={24} color={Colors[Theme]['text-secondary']} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <MaterialIcons name="category" size={24} color={Colors[Theme]['text-secondary']} />
                        <Text style={styles.actionText}>Categories</Text>
                        <Feather name="chevron-down" size={24} color={Colors[Theme]['text-secondary']} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <FontAwesome6 name="tags" size={24} color={Colors[Theme]['text-secondary']} />
                        <Text style={styles.actionText}>Interests</Text>
                        <Feather name="chevron-down" size={24} color={Colors[Theme]['text-secondary']} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <Feather name="calendar" size={24} color={Colors[Theme]['text-secondary']} />
                        <Text style={styles.actionText}>Schedule</Text>
                        <Feather name="chevron-down" size={24} color={Colors[Theme]['text-secondary']} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Share Button */}
            <View className={clsx(keyboardVisible && "hidden", 'absolute bottom-10 inset-x-6 z-10 bg-bg-default')}>
                <TouchableOpacity activeOpacity={.75} className="bg-text-primary py-5 rounded-lg" onPress={handleContinue}>
                    <Text className='text-text-inverted font-inter-bold text-center'>Post</Text>
                </TouchableOpacity>
            </View>
        </AppBackgroundBase>
    );
}


interface ListableItemProps {
    title: string
    icon: any
    children: any
    canExpand?: boolean
    additionalText?: string
}

function ListableItem({ icon, title, children, canExpand = true, additionalText }: ListableItemProps) {
    // States
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    // Callbacks
    const handleExpandPress = useCallback(() => {
        if (canExpand)
            setIsExpanded(prev => !prev)
    }, [isExpanded, setIsExpanded, canExpand])

    return (
        <View className='border-b border-bg-ultraslim'>
            <TouchableOpacity className='flex flex-row items-center p-4' activeOpacity={.85} onPress={handleExpandPress}>
                {icon}
                <Text className='ml-4 text-text-primary text-lg flex-1'>{title}</Text>
                <Text className={clsx(canExpand && "mr-4", 'text-bg-light')}>{additionalText}</Text>
                {canExpand && <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={Colors[Theme]['text-secondary']} />}
            </TouchableOpacity>
            <View className={clsx(!isExpanded && "hidden")}>
                {children}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerRight: {
        width: 24,
    },
    imageContainer: {
        height: 300,
        position: 'relative',
    },
    image: {
        flex: 1,
        backgroundColor: '#2a2a2a',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        borderRadius: 8,
    },
    overlayText: {
        color: 'white',
        fontSize: 16,
    },
    captionInput: {
        color: 'white',
        padding: 16,
        fontSize: 16,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    actionsList: {
        flex: 1,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#333',
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 16,
        flex: 1,
    },
    musicPreview: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        marginVertical: 8,
    },
    musicText: {
        color: 'white',
        fontSize: 14,
    },
    aiLabelContainer: {
        flex: 1,
        marginLeft: 16,
    },
    aiDescription: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    learnMore: {
        color: '#0095f6',
    },
    audienceRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    audienceText: {
        color: '#666',
        marginRight: 8,
    },
    shareButtonContainer: {
        padding: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#333',
    },
    shareButton: {
        backgroundColor: '#0095f6',
        padding: 14,
        borderRadius: 6,
        alignItems: 'center',
    },
    shareText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});