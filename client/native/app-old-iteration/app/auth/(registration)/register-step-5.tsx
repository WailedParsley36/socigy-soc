import { Colors, Theme } from "@/constants/Colors";
import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import PageBase from "@/components/PageBase";
import Heading from "@/components/registration/Heading";
import NextStep from "@/components/registration/NextStep";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import * as Contacts from 'expo-contacts';
import PlusIcon from "@/components/icons/PlusIcon";
import React, { useState } from "react";
import CheckBox from "@/components/input/CheckBox";
import { router, useNavigation } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import ColorFilterModifiableIcon from "@/components/icons/ColorFilterModifiableIcon";
import clsx from "clsx";
import { useAuthManager } from "@/managers/Exports";

const complexities = [
  {
    title: "Simple",
    description: "Don’t want to learn anything new? Then this is the mode made right for you",
    icon: (fill: string) => <ColorFilterModifiableIcon width="60" height="60" oneCicle fill={fill} />
  },
  {
    title: "Normal",
    description: "You will have the ability to utilize plugins, apps and certain advanced features",
    icon: (fill: string) => <ColorFilterModifiableIcon width="60" height="60" twoCircles fill={fill} />
  },
  {
    title: "Complex",
    description: "Unlock the full potential and experience the future with all that's available",
    icon: (fill: string) => <ColorFilterModifiableIcon width="60" height="60" threeCircles fill={fill} />
  }
]

export default function RegisterStep5() {
  const authManager = useAuthManager();
  const navigation = useNavigation();

  const [selectedComplexity, setSelcectedComplexity] = useState<string>('normal');
  const [error, setError] = useState<string>();

  const handleNextStep = async () => {
    const error = await authManager.completeRegistration(selectedComplexity);
    if (error) {
      setError(error.message)
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "app" as never }]
    })
  }

  return (
    <PageBase
      noScroll
      className="min-h-screen flex items-center w-4/5 self-center"
      wrapperChildren={
        <View className="h-1/3 overflow-hidden">
          <CircleBackground
            width="100%"
            height="100%"
            fill={Colors[Theme]["text-secondary"]}
            fillSecond={Colors[Theme]["bg-default"]}
            className="absolute top-0 left-0"
            style={{
              transform: [{ translateX: "-40%" }, { translateY: "-20%" }],
            }}
            x1={40}
            x2={180}
            y2={200}
          />
          <ElipseBackground
            width="125%"
            height="125%"
            fill={Colors[Theme]["text-secondary"]}
            fillSecond={Colors[Theme]["bg-default"]}
            className="absolute top-0 right-0"
            style={{
              transform: [{ translateX: "25%" }, { translateY: "-50%" }],
            }}
            x2={150}
            y2={-85}
          />
        </View>
      }
    >
      <Heading
        title="How much complexity can you handle?"
        description="Worried you will not understand the app layout? Choose a simpler layout and then move to the complex ones. Don't worry you can change this later in the settings"
        className="h-1/3 justify-end" />

      <View className="flex h-2/3">
        <View className="grow flex justify-center gap-y-10">
          {complexities.map(x =>
            <TouchableOpacity key={x.title} className="flex flex-row align-middle w-full gap-x-7" onPress={() => setSelcectedComplexity(x.title.toLocaleLowerCase())} activeOpacity={0.75}>
              <View className={clsx("flex align-middle justify-center text-center border p-6 rounded-lg", x.title.toLowerCase() == selectedComplexity ? "border-bg-slim bg-text-primary" : "border-bg-slim bg-bg-ultraslim")}>
                {x.title.toLowerCase() == selectedComplexity ? x.icon(Colors[Theme]["text-inverted"]) : x.icon(Colors[Theme]["text-primary"])}
              </View>
              <View className="grow w-1/3 gap-y-2 align-middle flex justify-center">
                <Text className="text-text-primary font-inter-semibold text-xl">{x.title}</Text>
                <Text className="text-text-third">{x.description}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <View className="mb-6">
          {error && <Text className="text-red-500">{error}</Text>}
          <NextStep onPress={handleNextStep} stepCurrent={5} stepMax={5} title="Finish" />
        </View>
      </View>
    </PageBase>
  );
}