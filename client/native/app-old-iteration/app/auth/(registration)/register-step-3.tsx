import { Colors, Theme } from "@/constants/Colors";
import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import FacebookLogoIcon from "@/components/icons/FacebookLogoIcon";
import FemaleIcon from "@/components/icons/FemaleIcon";
import GoogleLogoIcon from "@/components/icons/GoogleLogoIcon";
import MaleIcon from "@/components/icons/MaleIcon";
import PageBase from "@/components/PageBase";
import Heading from "@/components/registration/Heading";
import NextStep from "@/components/registration/NextStep";
import { Link, router } from "expo-router";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useAuthManager, useContentManager } from "@/managers/Exports";
import { useEffect, useState } from "react";
import { Category } from "@/data/content/Category";
import clsx from "clsx";

const startCount = 35;

export default function RegisterStep2() {
  const content = useContentManager();

  const [recommendedInterests, setRecommendedInterests] = useState<Category[]>()
  const [error, setError] = useState<string>();

  const [selectedInterests, setSelectedInterests] = useState<{ [key: number]: number }>({})
  const [isLoading, setIsLoading] = useState<number>();
  const [hasMoreRecommendationData, setHasMoreRecommendationData] = useState<boolean>(true);

  async function loadRecommendedInterests(offset: number = 0) {
    setIsLoading(startCount);

    const result = await content.getRecommendedInterests(startCount, offset);
    if (result.error != null) {
      setError(result.error.message)
      return
    }

    setRecommendedInterests((prev: any[] | undefined) => {
      setIsLoading(undefined)
      if (prev) {
        return [...prev, ...result.result!]
      }
      else
        return result.result
    });

    if (result.result!.length != startCount)
      setHasMoreRecommendationData(false)
  }

  useEffect(() => {
    loadRecommendedInterests()
  }, [])

  const handleInterestSelect = (id: number, score: number) => {
    setSelectedInterests(prev => {
      const prevObj = { ...prev };
      if (prevObj[id]) {
        delete prevObj[id];
        return prevObj;
      }

      prevObj[id] = score;
      return prevObj
    })
  }

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
    const paddingToBottom = 75; // Threshold for triggering fetch
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isCloseToBottom(nativeEvent) && !isLoading && hasMoreRecommendationData) {
      loadRecommendedInterests(recommendedInterests?.length)
    }
  };

  const handleNextStep = async () => {
    const keys = Object.keys(selectedInterests);
    if (keys.length > 0) {
      const result = await content.initializeUserInterests(keys.map(x => { return { id: Number(x), score: selectedInterests[Number(x)] } }));
      if (result) {
        setError(result.message)
        return;
      }
    }

    router.push('/auth/(registration)/register-step-4')
  }

  const handleSkipStep = () => {
    router.push('/auth/(registration)/register-step-4')
  }

  return (
    <PageBase
      className="min-h-screen flex items-center w-4/5 self-center"
      noScroll
      wrapperChildren={
        <View className="h-1/4 overflow-hidden">
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
        title="Personalize based on your interests"
        description="If you want to see content based on your interests from the start then feel free to select few interests. Don't worry you can edit this later"
        className="h-1/4" />

      <ScrollView
        className="flex-1 -mx-5"
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-wrap gap-4 pb-10 flex-row justify-center">
          {recommendedInterests?.map(x =>
            <TouchableOpacity key={x.id} className={clsx("flex justfiy-center items-center gap-y-2 px-5 py-3 border-2 rounded-full", selectedInterests[x.id] ? "border-bg-medium bg-bg-ultraslim" : "border-bg-ultraslim")} onPress={() => handleInterestSelect(x.id, 50)}>
              <Text className="text-text-primary">
                {x.emoji} {x.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <NextStep onPress={handleNextStep} stepCurrent={3} stepMax={5} skip onSkip={handleSkipStep} />
    </PageBase>
  );
}