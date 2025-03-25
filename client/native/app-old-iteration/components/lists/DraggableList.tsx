import React from 'react';
import { Dimensions, Platform, View } from 'react-native';

import Animated, {
    scrollTo,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useSharedValue,
} from 'react-native-reanimated';
import { ListItem } from './DraggableListItem';

const ANIMATION_DURATION = 600;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const EDGE_THRESHOLD = 40;
const MIN_BOUNDRY = 0;
const SCROLL_SPEED_OFFSET = Platform.select({ default: 3, android: 2 });
const ANIMATED_SCROLL_TO = Platform.select({ default: true, ios: false });

const computeInitialPositions = (dataLength: number, itemHeight: number) => {
    let itemPositions: ItemPosition = {};
    for (let i = 0; i < dataLength; i++) {
        itemPositions[i] = {
            updatedIndex: i,
            updatedTop: i * itemHeight,
        };
    }
    return itemPositions;
}

export type ItemPosition = {
    [key: string]: {
        updatedIndex: number;
        updatedTop: number
    }
}

interface DraggableListProps<T> {
    data: T[],
    itemHeight: number,
    keyExtractor: (item: T) => string
}


export default function DraggableList<T>({ data, itemHeight, keyExtractor }: DraggableListProps<T>) {
    const MAX_BOUNDRY = (data.length - 1) * itemHeight;

    const scrollviewRef = useAnimatedRef<Animated.ScrollView>();

    //will hold the songs position in list at every moment
    const currentSongPositions = useSharedValue<ItemPosition>(
        computeInitialPositions(data.length, itemHeight),
    );

    //used to control the animation visual using interpolation
    const isDragging = useSharedValue<0 | 1>(0);

    //this will hold id for item which user started dragging
    const draggedItemId = useSharedValue<number | null>(null);

    //used to stop the automatic scroll once drag is ended by user.
    const isDragInProgress = useSharedValue(false);
    const scrollY = useSharedValue(0);

    const scrollUp = () => {
        'worklet';
        const newY =
            scrollY.value - SCROLL_SPEED_OFFSET < 0
                ? 0
                : scrollY.value - SCROLL_SPEED_OFFSET;
        scrollTo(scrollviewRef, 0, newY, ANIMATED_SCROLL_TO);
    };

    const scrollDown = () => {
        'worklet';
        const newY =
            scrollY.value + SCROLL_SPEED_OFFSET > data.length * itemHeight
                ? data.length * itemHeight
                : scrollY.value + SCROLL_SPEED_OFFSET;
        scrollTo(scrollviewRef, 0, newY, ANIMATED_SCROLL_TO);
    };

    const scrollHandler = useAnimatedScrollHandler(event => {
        scrollY.value = event.contentOffset.y;
    });

    return (
        <View className='flex-1'>
            <Animated.ScrollView
                scrollEventThrottle={10}
                ref={scrollviewRef}
                onScroll={scrollHandler}
                contentContainerStyle={{ height: data.length * itemHeight }}>
                {data.map(item => (
                    <ListItem
                        item={item}
                        itemHeight={itemHeight}
                        itemKey={keyExtractor(item)}
                        itemCount={data.length}
                        key={keyExtractor(item)}
                        isDragging={isDragging}
                        draggedItemId={draggedItemId}
                        currentSongPositions={currentSongPositions}
                        scrollUp={scrollUp}
                        scrollDown={scrollDown}
                        scrollY={scrollY}
                        isDragInProgress={isDragInProgress}
                    />
                ))}
            </Animated.ScrollView>
        </View>
    );
};