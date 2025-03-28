import {
    SharedValue,
    interpolate,
    interpolateColor,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { ItemPosition } from '../DraggableList';
import { Colors, Theme } from '@/constants/Colors';
import { Dimensions } from 'react-native';

const MIN_BOUNDRY = 0;
const MAX_BOUNDRY = (itemHeight: number, itemCount: number) => (itemCount - 1) * itemHeight;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const EDGE_THRESHOLD = 40;

export function useGesture(
    itemKey: string,
    itemCount: number,
    itemIndex: number,
    itemHeight: number,
    isDragging: SharedValue<number>,
    draggedItemId: SharedValue<string | null>,
    currentSongPositions: SharedValue<ItemPosition>,
    scrollUp: () => void,
    scrollDown: () => void,
    scrollY: SharedValue<number>,
    isDragInProgress: SharedValue<boolean>,
) {
    //used for swapping with currentIndex
    const newIndex = useSharedValue<number | null>(null);

    //used for swapping with newIndex
    const currentIndex = useSharedValue<number | null>(null);

    const currentSongPositionsDerived = useDerivedValue(() => {
        return currentSongPositions.value;
    });

    const top = useSharedValue(itemIndex * itemHeight);

    const isDraggingDerived = useDerivedValue(() => {
        return isDragging.value;
    });

    const draggedItemIdDerived = useDerivedValue(() => {
        return draggedItemId.value;
    });

    const isDragInProgressDerived = useDerivedValue(() => {
        return isDragInProgress.value;
    });

    const scrollYDerived = useDerivedValue(() => {
        return scrollY.value;
    });

    const isCurrentDraggingItem = useDerivedValue(() => {
        return draggedItemIdDerived.value === itemKey;
    });

    const totalY = useSharedValue(0);

    const getKeyOfValue = (
        value: number,
        obj: ItemPosition,
    ): number | undefined => {
        'worklet';
        for (const [key, val] of Object.entries(obj)) {
            if (val.updatedIndex === value) {
                return Number(key);
            }
        }
        return undefined; // Return undefined if the value is not found
    };

    const onGestureUpdate = (newTop: number) => {
        'worklet';
        let topEdge = scrollYDerived.value;
        let bottomEdge =
            scrollYDerived.value + SCREEN_HEIGHT - EDGE_THRESHOLD * 2.5;
        const isUpperEdge =
            parseInt(newTop.toFixed(2), 10) <= parseInt(topEdge.toFixed(2), 10);
        const isBottomEdge =
            parseInt(newTop.toFixed(2), 10) >= parseInt(bottomEdge.toFixed(2), 10);
        if (
            currentIndex.value === null ||
            newTop <= MIN_BOUNDRY ||
            newTop >= MAX_BOUNDRY(itemHeight, itemCount)
        ) {
            return;
        }

        if (isUpperEdge) {
            top.value = topEdge;
        } else if (isBottomEdge) {
            top.value = bottomEdge;
        } else {
            top.value = newTop;
        }

        //calculate the new index where drag is headed to
        newIndex.value = Math.floor((top.value + itemHeight / 2) / itemHeight);
        //swap the items present at newIndex and currentIndex
        if (newIndex.value !== currentIndex.value) {
            //find id of the item that currently resides at newIndex
            const newIndexItemKey = getKeyOfValue(
                newIndex.value,
                currentSongPositionsDerived.value,
            );

            //find id of the item that currently resides at currentIndex
            const currentDragIndexItemKey = getKeyOfValue(
                currentIndex.value,
                currentSongPositionsDerived.value,
            );

            if (
                newIndexItemKey !== undefined &&
                currentDragIndexItemKey !== undefined
            ) {
                //we update updatedTop and updatedIndex as next time we want to do calculations from new top value and new index
                currentSongPositions.value = {
                    ...currentSongPositionsDerived.value,
                    [newIndexItemKey]: {
                        ...currentSongPositionsDerived.value[newIndexItemKey],
                        updatedIndex: currentIndex.value,
                        updatedTop: currentIndex.value * itemHeight,
                    },
                    [currentDragIndexItemKey]: {
                        ...currentSongPositionsDerived.value[currentDragIndexItemKey],
                        updatedIndex: newIndex.value,
                    },
                };

                //update new index as current index
                currentIndex.value = newIndex.value;
            }
        }

        if (isUpperEdge) {
            scrollUp();
        } else if (isBottomEdge) {
            scrollDown();
        }
    };

    useAnimatedReaction(
        () => {
            return scrollYDerived.value;
        },
        (currentValue, previousValue) => {
            if (!isDragInProgressDerived.value || !isCurrentDraggingItem.value) {
                //useAnimatedReaction executed for every item when scroll happens
                //we don't want to trigger automatic gesture if drag is not happening
                //also we just want to trigger automatic gesture for currently dragged item
                return;
            }
            const isScrolledUp = (previousValue || 0) > currentValue;
            onGestureUpdate(
                isScrolledUp
                    ? top.value - Math.abs(currentValue - (previousValue || 0))
                    : top.value + Math.abs(currentValue - (previousValue || 0)),
            );
        },
    );

    useAnimatedReaction(
        () => {
            return currentSongPositionsDerived.value[itemKey].updatedIndex;
        },
        (currentValue, previousValue) => {
            //useAnimatedReaction executed when any of the item's updatedIndex changes
            if (currentValue !== previousValue) {
                if (!isCurrentDraggingItem.value) {
                    top.value = withTiming(
                        currentSongPositionsDerived.value[itemKey].updatedIndex *
                        itemHeight,
                        { duration: 500 },
                    );
                }
            }
        },
    );

    const gesture = Gesture.Pan()
        .onTouchesDown(e => {
            isDragging.value = withSpring(1);
            //keep track of dragged item
            draggedItemId.value = itemKey;

            //start dragging
            isDragInProgress.value = true;

            //store dragged item id for future swap
            currentIndex.value =
                currentSongPositionsDerived.value[itemKey].updatedIndex;

            //as soon as user touches the item, store total distance of user's finger from top of list
            totalY.value = scrollYDerived.value + e.allTouches[0].absoluteY;
        })
        .onUpdate(e => {
            if (draggedItemIdDerived.value === null) {
                return;
            }
            //calculate new total distance of user's finger from top of list.
            const newTotalY = scrollYDerived.value + e.absoluteY;
            //calculate difference between the prev and new total distance
            const diff = totalY.value - newTotalY;
            //calculate the updated top of item
            const updatedTop =
                currentSongPositionsDerived.value[draggedItemIdDerived.value]
                    .updatedTop;
            //calculate new top value by negating diff of total distance from updated top
            const newTop = updatedTop - diff;
            onGestureUpdate(newTop);
        })
        .onTouchesUp(() => {
            isDragInProgress.value = false;
            draggedItemId.value = null;

            //stop dragging with delay of 200ms to have nice animation consistent with scale animation
            isDragging.value = withDelay(200, withSpring(0));
            if (newIndex.value === null || currentIndex.value === null) {
                return;
            }
            top.value = withSpring(newIndex.value * itemHeight);

            const currentDragIndexItemKey = getKeyOfValue(
                currentIndex.value,
                currentSongPositionsDerived.value,
            );

            if (currentDragIndexItemKey !== undefined) {
                //update the values for item whose drag we just stopped
                currentSongPositions.value = {
                    ...currentSongPositionsDerived.value,
                    [currentDragIndexItemKey]: {
                        ...currentSongPositionsDerived.value[currentDragIndexItemKey],
                        updatedTop: newIndex.value * itemHeight,
                    },
                };
            }
        });

    const animatedStyles = useAnimatedStyle(() => {
        return {
            top: top.value,
            transform: [
                {
                    scale: isCurrentDraggingItem.value
                        ? interpolate(isDraggingDerived.value, [0, 1], [1, 1.025])
                        : interpolate(isDraggingDerived.value, [0, 1], [1, 0.98]),
                },
            ],
            backgroundColor: isCurrentDraggingItem.value
                ? interpolateColor(
                    isDraggingDerived.value,
                    [0, 1],
                    [Colors[Theme]['bg-ultraslim'], Colors[Theme]['bg-slim']],
                )
                : Colors[Theme]['bg-ultraslim'],

            style: {
                shadowOffset: {
                    width: 0,
                    height: isCurrentDraggingItem.value
                        ? interpolate(isDraggingDerived.value, [0, 1], [0, 7])
                        : 0,
                },
            },
            shadowOpacity: isCurrentDraggingItem.value
                ? interpolate(isDraggingDerived.value, [0, 1], [0, 0.2])
                : 0,
            shadowRadius: isCurrentDraggingItem.value
                ? interpolate(isDraggingDerived.value, [0, 1], [0, 10])
                : 0,
            elevation: isCurrentDraggingItem.value
                ? interpolate(isDraggingDerived.value, [0, 1], [0, 5])
                : 0, // For Android,
            zIndex: isCurrentDraggingItem.value ? 1 : 0,
        };
    }, [top.value, isCurrentDraggingItem.value, isDraggingDerived.value]);

    return {
        animatedStyles,
        gesture,
    };
};