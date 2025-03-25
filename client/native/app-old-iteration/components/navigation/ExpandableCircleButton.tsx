import { Colors, Theme } from '@/constants/Colors';
import { Href, Link, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { ColorValue, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, { ReduceMotion, runOnUI, useAnimatedStyle, useSharedValue, withTiming, Easing, interpolate } from "react-native-reanimated";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";

const animationDuration = 400;
// const easingFunc = Easing.bezier(1, 0, .5, .97);
const easingFunc = Easing.bezier(.70, 0, .25, 1.25);

interface ExpandableCircleButtonProps {
    radius: number
    yOffset?: number
    circleColors: ColorValue[]
    circleRoutes: Href[]

    mainCircleElement: any
    circleElements: any[]

    onCirclePressed: (index: number) => void
    mainCirclePressed?: () => void,
    mainCircleLongPress?: () => void
    onOpenChanged?: (value: boolean) => void

    mainSize?: number,
    circleSize?: number,
    circleStyles?: StyleProp<ViewStyle>[]
    mainCircleStyle?: StyleProp<ViewStyle>
}

export default function ExpandableCircleButton({ circleRoutes, onOpenChanged, yOffset = 0, mainCircleLongPress, mainCirclePressed, radius, mainCircleStyle, circleStyles, circleColors, mainCircleElement, circleElements, onCirclePressed, mainSize, circleSize }: ExpandableCircleButtonProps) {
    const surroundingRadius = useSharedValue(0); // Radius of the surrounding circles
    const mainOpacity = useSharedValue(0);
    const numberOfSurroundingCircles = circleColors.length; // Number of surrounding circles
    if (!mainSize)
        mainSize = 100;
    if (!circleSize)
        circleSize = 80;

    const toggleAnimation = async (open: boolean | undefined = undefined) => {
        if (open == undefined && mainCircleLongPress)
            mainCircleLongPress()
        else if (open == false && mainCirclePressed)
            mainCirclePressed();

        const options = { duration: animationDuration, easing: easingFunc, reduceMotion: ReduceMotion.Never };
        if (surroundingRadius.value == 0 && (open == true || open == undefined)) {
            if (onOpenChanged)
                onOpenChanged(true);
            surroundingRadius.value = withTiming(radius, options);
            mainOpacity.value = withTiming(100, options);
        }
        else if (open == undefined || open == false) {
            if (onOpenChanged)
                onOpenChanged(false);

            options.duration /= 2

            surroundingRadius.value = withTiming(0, options);
            mainOpacity.value = withTiming(0, options)
        }
    }

    const getAnimatedStyleForCircle = (index: number) => {
        let value = 0;
        // 3 Circles
        // const angle = (index / numberOfSurroundingCircles) * -270;
        const angle = (index / numberOfSurroundingCircles) * -240;
        return useAnimatedStyle(() => {
            // const x = Math.cos((angle * Math.PI) / 180) * surroundingRadius.value
            // const y = (Math.sin((angle * Math.PI) / 180) * surroundingRadius.value) / 1.5 - (value * surroundingRadius.value / 100) + (yOffset * surroundingRadius.value / 100)
            // if (surroundingRadius.value == 0)
            //     value += 2

            const x = (Math.cos((angle * Math.PI) / 180) * surroundingRadius.value) / 1.3
            const y = (Math.sin((angle * Math.PI) / 180) * surroundingRadius.value) / 1.5 - (value * surroundingRadius.value / 100) + (yOffset * surroundingRadius.value / 100)
            if (surroundingRadius.value == 0)
                value += 2

            return {
                transform: [{
                    translateX: x - (circleSize / 2)
                },
                {
                    translateY: y - (circleSize / 2)
                },
                {
                    scale: interpolate(surroundingRadius.value, [0, radius], [mainSize / circleSize, 1])
                }]
            }
        });
    }

    const mainCircleAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(mainOpacity.value, [0, 100], [0, 1]);
        return {
            backgroundColor: Colors[Theme]['bg-default-rgb'].replace("A", opacity.toString())
        }
    });
    const circleTextAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(surroundingRadius.value, [0, radius], [0, 1])
    }))

    const animatedStyles: any[] = []
    for (let i = 0; i < numberOfSurroundingCircles; i++)
        animatedStyles.push(getAnimatedStyleForCircle(i));

    return (
        <View className="flex-1 justify-center align-middle items-center relative">
            <Animated.View
                className="z-10 absolute justify-center items-center align-middle rounded-full"
                style={[mainCircleStyle, mainCircleAnimatedStyle]}
            >
                <TouchableOpacity activeOpacity={.75} onLongPress={() => toggleAnimation()} onPress={() => toggleAnimation(false)}
                    className="flex-1 justify-center items-center rounded-full"
                    style={{
                        width: mainSize ?? 100,
                        height: mainSize ?? 100
                    }}>
                    {mainCircleElement}
                </TouchableOpacity>
            </Animated.View>

            <View>
                {circleColors.map((x, index) => {
                    return (
                        <Animated.View
                            key={index}
                            className='absolute justify-center align-middle items-center rounded-full'
                            style={[circleStyles?.at(index), { backgroundColor: x, width: circleSize ?? 80, height: circleSize ?? 80 }, animatedStyles[index]]}>
                            <Link href={circleRoutes[index]} className='z-10 flex-1 absolute inset-0 rounded-full' onPress={() => {
                                onCirclePressed(index)
                                toggleAnimation(false)
                            }} />
                            <Animated.View style={circleTextAnimatedStyle}>
                                {circleElements[index]}
                            </Animated.View>
                        </Animated.View>
                    );
                })}
            </View>
        </View>
    );
};