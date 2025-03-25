import { Colors, Theme } from "@/constants/Colors";
import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import CameraIcon from "@/components/icons/CameraIcon";
import SendIcon from "@/components/icons/SendIcon";
import PageBase from "@/components/PageBase";
import Heading from "@/components/registration/Heading";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import QRCode from 'react-native-qrcode-svg';

const mockedUsers = [
  {
    username: "WailedParsley 36",
    tag: "5536",
    iconUrl: 'https://socigy.com/favicon/favicon.svg'
  },
  {
    username: "Will1am3ek",
    tag: "1234",
    iconUrl: 'https://socigy.com/favicon/favicon.svg'
  },
  {
    username: "Someone else",
    tag: "1234",
    iconUrl: 'https://socigy.com/favicon/favicon.svg'
  },
  {
    username: "Someone else",
    tag: "1235",
    iconUrl: 'https://socigy.com/favicon/favicon.svg'
  },
  {
    username: "Someone else",
    tag: "1236",
    iconUrl: 'https://socigy.com/favicon/favicon.svg'
  },
  {
    username: "Someone else",
    tag: "1237",
    iconUrl: 'https://socigy.com/favicon/favicon.svg'
  }
]

export default function RegisterStepChild() {
  const [qrAddress, setQrAddress] = useState("https://socigy.com");
  const [userFinderOpen, setUserFinderOpen] = useState(false);
  const [foundUsers, setFoundUsers] = useState<{ iconUrl: string, tag: string, username: string }[]>(mockedUsers);
  const [findingUserInfo, setFindingUserInfo] = useState<{ tag: string, username: string }>({ tag: '', username: '' });

  const handleNextStep = () => {
    router.push('/auth/(registration)/register-step-2')
  }

  const handleOpenUserFinder = () => {
    setUserFinderOpen(true)
  }

  const handleCloseUserFinder = () => {
    setUserFinderOpen(false)
  }

  const handleUserFindChangedUsername = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setFindingUserInfo({ ...findingUserInfo, username: e.nativeEvent.text })
  }
  const handleUserFindChangedTag = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setFindingUserInfo({ ...findingUserInfo, tag: e.nativeEvent.text })
  }

  return (
    <PageBase
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
        title="Before continuing we need to get your parents approval"
        description="Because you're under 16 we need to know that your parents approve creation of this account."
        className="h-1/3" />

      {!userFinderOpen && (<>
        <View className="flex flex-row justify-center items-center">
          {/* // TODO: Don't forget to remove the TouchStart cheat */}
          <View className="grow mr-6 ml-10 flex justify-center" style={{ transform: [{ scale: 1.15 }] }} onTouchStart={handleNextStep}>
            <QRCode value={qrAddress} backgroundColor={Colors[Theme]["bg-default"]} color={Colors[Theme]["text-primary"]} />
          </View>
          <View className="w-2/3">
            <Text className="text-text-secondary font-inter-extrabold text-xl mb-2">
              Scan this on your parents phone
            </Text>
            <Text className="text-text-third font-inter-regular">
              You can scan this using your camera app, or through the app in <Text className="font-inter-semibold">Settings → Family → Add Member</Text>
            </Text>
          </View>
        </View>

        <View className="flex flex-row justify-center items-center mt-10 mb-10">
          <View style={styles.divider} />
          <Text className="text-bg-light font-inter-semibold mx-4">
            Or find them
          </Text>
          <View style={styles.divider} />
        </View>
      </>)}

      <View className="flex flex-row" onTouchStart={handleOpenUserFinder}>
        <View className="w-7/12" style={{ marginRight: "8.333333%" }}>
          <Text className="text-text-primary font-inter-medium mb-2">Username <Text className="text-red-500 font-inter-extrabold">*</Text></Text>
          <TextInput onChange={handleUserFindChangedUsername} className="text-text-secondary border-2 border-bg-ultraslim font-inter-light p-4 rounded-xl" inputMode='text' />
        </View>
        <View className="w-4/12">
          <Text className="text-text-primary font-inter-medium mb-2">Tag</Text>
          <View>
            <Text className="text-text-secondary text-xl absolute left-4 top-4">#</Text>
            <TextInput onChange={handleUserFindChangedTag} className="text-text-secondary border-2 border-bg-ultraslim font-inter-light p-4 pl-9 rounded-xl" inputMode='numeric' maxLength={4} />
          </View>
        </View>
      </View>

      {!userFinderOpen ?
        <>
          <View className="flex flex-row justify-center items-center mt-10 mb-10">
            <View style={styles.divider} />
            <Text className="text-bg-light font-inter-semibold mx-4">
              Or scan their QR Code
            </Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity className="bg-text-primary text-text-inverted py-5 px-10 rounded-lg w-full flex flex-row gap-x-4 justify-center items-center">
            <CameraIcon width="30" height="24" fill={Colors[Theme]["text-inverted"]} />
            <Text className="font-inter-bold">
              Use the camera app
            </Text>
          </TouchableOpacity>
        </> :
        <>
          <ScrollView className="w-full h-96 mt-10">
            <View className="gap-y-4">
              {foundUsers.length == 0 ? <Text className="text-text-primary text-center text-lg">No users found</Text> :
                foundUsers.map(x =>
                  <View key={x.tag + x.username} className="flex flex-row items-center gap-x-4">
                    <View className="bg-text-primary w-14 h-14 rounded-full" />
                    <View className="grow">
                      <Text className="text-text-third">#{x.tag}</Text>
                      <Text className="text-text-secondary">{x.username}</Text>
                    </View>
                    <TouchableOpacity className="px-5 py-2 rounded-lg bg-bg-slim">
                      <SendIcon width="24" height="24" fill={Colors[Theme]["text-primary"]} fillSecond={Colors[Theme]["bg-slim"]} />
                    </TouchableOpacity>
                  </View>
                )
              }
            </View>
          </ScrollView>
          <View onTouchStart={handleCloseUserFinder} className="my-10">
            <Text className="text-text-primary text-lg font-inter-semibold">Back</Text>
          </View>
        </>
      }
    </PageBase>
  );
}

const styles = StyleSheet.create({
  divider: {
    borderBottomColor: Colors[Theme]["bg-light"], borderBottomWidth: 1, flex: 1
  }
})