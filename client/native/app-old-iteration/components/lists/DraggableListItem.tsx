import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';

import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useGesture } from './hooks/useGesture';
import { Colors, Theme } from '@/constants/Colors';

export const ListItem = ({
    itemKey,
    itemIndex,
    itemHeight,
    itemCount,
    item,
    isDragging,
    draggedItemId,
    currentSongPositions,
    scrollUp,
    scrollDown,
    scrollY,
    isDragInProgress,
}: any) => {
    const { animatedStyles, gesture } = useGesture(
        itemKey,
        itemCount,
        itemIndex,
        itemHeight,
        isDragging,
        draggedItemId,
        currentSongPositions,
        scrollUp,
        scrollDown,
        scrollY,
        isDragInProgress,
    );

    return (
        <Animated.View key={item.id} style={[styles.itemContainer, animatedStyles, {
            height: itemHeight
        }]}>
            <View style={[styles.imageContainer, { height: itemHeight }]}>
                <Image
                    source={{
                        uri: item.imageSrc,
                    }}
                    style={[styles.image, { height: itemHeight - 20 }]}
                    borderRadius={8}
                />
            </View>
            <View style={styles.descriptionContainer}>
                <Text style={styles.description1}>{item.title}</Text>
                <Text style={styles.description2}>{item.singer}</Text>
            </View>
            <GestureDetector gesture={gesture}>
                <Animated.View style={styles.draggerContainer}>
                    <View style={[styles.dragger, styles.marginBottom]} />
                    <View style={[styles.dragger, styles.marginBottom]} />
                    <View style={styles.dragger} />
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        position: 'absolute',
    },
    imageContainer: {
        width: '20%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '3%',
    },
    descriptionContainer: {
        width: '60%',
        justifyContent: 'space-evenly',
    },
    description1: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors[Theme]['text-secondary']
    },
    description2: { color: Colors[Theme]['text-third'] },
    draggerContainer: {
        width: '20%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    marginBottom: {
        marginBottom: 5,
    },
    dragger: {
        width: '30%',
        height: 2,
        backgroundColor: Colors[Theme]['text-secondary'],
    },
    image: {
        width: '97%',
    },
});