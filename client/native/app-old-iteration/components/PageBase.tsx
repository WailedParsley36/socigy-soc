import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PageBase({ children, wrapperChildren, noScroll, ...rest }: any) {
  return (
    <View className="min-h-screen bg-bg-default">
      {noScroll ? <>
        <View className="absolute inset-0">{wrapperChildren}</View>
        <SafeAreaView className="min-h-screen">
          <View {...rest}>{children}</View>
        </SafeAreaView>
      </> :
        <ScrollView className="min-h-screen">
          <View className="absolute inset-0">{wrapperChildren}</View>
          <SafeAreaView className="min-h-screen">
            <View {...rest}>{children}</View>
          </SafeAreaView>
        </ScrollView>
      }
    </View>
  );
}
