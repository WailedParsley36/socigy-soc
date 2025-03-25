import { Dimensions, Text, View, StyleSheet, Alert } from "react-native";
import PageBase from "@/components/PageBase";
import SocigyLogoIcon from "@/components/icons/SocigyLogoIcon";
import React, { useEffect, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import RightIcon from "@/components/icons/RightIcon";
import { Colors, Theme } from "@/constants/Colors";
import { router } from "expo-router";
import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import * as SystemUI from "expo-system-ui";

SystemUI.setBackgroundColorAsync(Colors[Theme]["bg-default"]);

export default function Index() {
  const xOffset = useSharedValue<number>(0);
  const [sliderLayout, setSliderLayout] = useState({
    containerWidth: screenWidth * 0.8,
    sliderWidth: -1,
    sliderPadding: 7,
    done: false,
  });

  useEffect(() => {
    async function test() {
      try {
        const response = await fetch("https://192.168.1.103");
        Alert.alert("Success");
      } catch (e) {
        Alert.alert(e.toString());
      }
    }

    test();
  }, []);

  const pan = Gesture.Pan()
    .onBegin(() => {
      xOffset.value = 0;
    })
    .onChange((e) => {
      if (e.translationX < 0) return;

      xOffset.value = e.translationX;
      // if (changeWidth) changeWidth(e.translationX);
    })
    .onFinalize((e) => {
      if (sliderLayout.done) return;

      if (
        e.translationX >=
        (sliderLayout.containerWidth - sliderLayout.sliderWidth) * 0.5
      ) {
        xOffset.value = withSpring(
          sliderLayout.containerWidth -
            (sliderLayout.sliderWidth + sliderLayout.sliderPadding * 3),
          { stiffness: 80, duration: 500 },
          () => runOnJS(router.replace)("/app")
        );
      } else {
        xOffset.value = withSpring(0, { stiffness: 80, duration: 1000 });
      }
    });

  const slidingStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: xOffset.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          xOffset.value,
          [0, sliderLayout.containerWidth],
          [1, 1.75]
        ),
      },
      {
        translateY: interpolate(
          xOffset.value,
          [0, sliderLayout.containerWidth],
          [0, sliderLayout.containerWidth / 2]
        ),
      },
    ],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          xOffset.value,
          [0, sliderLayout.containerWidth],
          [1, 1.25]
        ),
      },
    ],
  }));

  const parentStyle = useAnimatedStyle(() => {
    return {
      width:
        sliderLayout.sliderWidth < 0
          ? undefined
          : xOffset.value +
            sliderLayout.sliderWidth -
            sliderLayout.sliderPadding * 2,
    };
  });

  const textOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      xOffset.value,
      [
        0,
        sliderLayout.containerWidth -
          (sliderLayout.sliderWidth + sliderLayout.sliderPadding),
      ],
      [1, -5]
    ),
  }));

  const handleRootViewLayout = (e: any) => {
    setSliderLayout({
      ...sliderLayout,
      containerWidth: e.nativeEvent.layout.width,
    });
  };

  const handleSliderLayout = (e: any) => {
    if (sliderLayout.sliderWidth > 0) return;

    const { x, width } = e.nativeEvent.layout;
    setSliderLayout({
      ...sliderLayout,
      sliderPadding: x,
      sliderWidth: width + x * 2, // Adjust width based on padding and content
    });
  };

  return (
    <PageBase
      className="min-h-screen flex items-center justify-center py-24 w-3/4 self-center"
      wrapperChildren={
        <Animated.View style={backgroundStyle}>
          <CircleBackground
            width="75%"
            height="50%"
            fill={Colors[Theme]["text-secondary"]}
            fillSecond={Colors[Theme]["bg-lighter"]}
            className="absolute top-0 left-0"
            style={{
              transform: [{ translateX: "-50%" }, { translateY: "-25%" }],
            }}
          />
          <ElipseBackground
            width="65%"
            height="50%"
            fill={Colors[Theme]["text-secondary"]}
            fillSecond={Colors[Theme]["bg-lighter"]}
            className="absolute top-0 right-0"
            style={{
              transform: [{ translateX: "95%" }, { translateY: "-75%" }],
            }}
            x2={0}
            y2={0}
          />
        </Animated.View>
      }
    >
      <Animated.View className="w-full grow flex" style={logoStyle}>
        <View className="max-h-28 my-auto">
          <SocigyLogoIcon height="100%" width="100%" fill="white" />
        </View>
      </Animated.View>
      <View>
        <Text
          className="font-inter-regular text-text-primary text-4xl mb-4"
          style={{ lineHeight: 44 }}
        >
          Change the way how you use{" "}
          <Text className="font-inter-extrabold">Social Networks</Text>
        </Text>
        <Text className="font-inter-regular text-text-third text-base mb-10">
          Social network needs a change, and we're here to make it happen
        </Text>
      </View>

      <SwipeToStart
        handleRootViewLayout={handleRootViewLayout}
        pan={pan}
        handleSliderLayout={handleSliderLayout}
        parentStyle={parentStyle}
        slidingStyle={slidingStyle}
        textOpacity={textOpacity}
      />
    </PageBase>
  );
}

const screenWidth = Dimensions.get("window").width;

function SwipeToStart({
  handleRootViewLayout,
  pan,
  handleSliderLayout,
  parentStyle,
  slidingStyle,
  textOpacity,
}: any) {
  return (
    <View
      className="bg-primary w-full h-[5.5rem] rounded-full flex flex-row justify-start overflow-hidden"
      onLayout={handleRootViewLayout}
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          className="bg-bg-default my-2 ml-2 px-4 rounded-full relativeflex flex-row justify-start items-center z-10"
          onLayout={handleSliderLayout}
          style={parentStyle}
        >
          <Animated.View
            style={slidingStyle}
            className="flex flex-row justify-start items-center"
          >
            <RightIcon
              width="20"
              height="20"
              fill={Colors[Theme]["bg-light"]}
            />
            <RightIcon
              width="20"
              height="20"
              fill={Colors[Theme]["bg-medium"]}
            />
            <RightIcon
              width="20"
              height="20"
              fill={Colors[Theme]["text-primary"]}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Animated.Text
        className="font-inter-extrabold grow text-center text-lg my-auto mx-auto"
        style={textOpacity}
      >
        Swipe to get started
      </Animated.Text>
    </View>
  );
}
