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
  Linking,
  ScrollView
} from "react-native";

import * as Contacts from 'expo-contacts';
import PlusIcon from "@/components/icons/PlusIcon";
import React, { useEffect, useState } from "react";
import CheckBox from "@/components/input/CheckBox";
import { BlurView } from 'expo-blur';
import AddContactsIcon from "@/components/icons/AddContactsIcon";
import { router } from "expo-router";
import { findPhoneNumbersInText } from 'libphonenumber-js'
import ShareIcon from "@/components/icons/ShareIcon";
import { useUserManager } from "@/managers/Exports";
import { ContactImportResponse } from "@/data/api/responses/ContactImportResponse";
import { Share } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import CheckmarkIcon from "@/components/icons/CheckmarkIcon";

interface ImportedContact {
  id: string,

  name: string
  firstName?: string | undefined
  lastName?: string | undefined

  color: string,

  phoneNumbers: { number: string, countryCode?: string }[]
  emails: string[]
}

const colors = ["#FF9A6B", "#FFB6A2", "#FFD966", "#87CEEB", "#98FB98", "#FFCC00", "#66CDAA", "#FF7F50", "#ADD8E6", "#FFB3A7", "#E0E8A8"]

let previous = 0;
function getRandomSaturatedColor() {
  const current = Math.floor(Math.random() * colors.length);

  if (current == previous)
    return getRandomSaturatedColor();

  previous = current;
  return colors[current];
}

const shareMessage = `🚀 Join Socigy today and experience the next-gen social network! 🎉\r\n\r\nRegistration is simple just click here: https://socigy.com/register\r\n\r\nLooking forward to seeing you on board! 🌟`;

// TODO: Animate modal closing

export default function RegisterStep3() {
  const userManager = useUserManager();

  const [importedContacts, setimportedContacts] = useState<ImportedContact[]>();
  const [existingContacts, setExistingContacts] = useState<ContactImportResponse[]>();

  const [shouldSelectAll, setShouldSelectAll] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<{ [id: string]: null }>({});

  const [modalOpen, setModalOpen] = useState<boolean>(true);
  const [modalError, setModalError] = useState<string>();

  const pulseValue = useSharedValue<number>(100);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseValue.value }));

  const startPulsing = () => {
    pulseValue.value = withRepeat(withTiming(1.2, { duration: 500 }), -1, true);
  }

  const importContacts = async () => {
    const contacts = await Contacts.getContactsAsync();
    if (contacts.data.length == 0) {
      handleNextStep();
      return;
    }

    const importedContacts = contacts.data.map(x => {
      let name = x.name.substring(0, Math.min(20, x.name.length)).split('@')[0];
      name = name[0].toUpperCase() + name.substring(1);
      if (name.length > 20)
        name += "...";

      return {
        id: x.id!,
        name: name,
        firstName: x.firstName?.substring(0, Math.min(20, x.firstName.length)),
        lastName: x.lastName?.substring(0, Math.min(20, x.lastName.length)),

        color: getRandomSaturatedColor(),

        emails: x.emails?.filter(x => x.email != null).map(x => x.email!) ?? [],
        phoneNumbers: x.phoneNumbers?.filter(x => x.number != null).map(x => {
          const numbers = findPhoneNumbersInText(x.number!);
          if (numbers.length == 0)
            return null;

          return { number: numbers[0].number.number, countryCode: numbers[0].number.country };
        }).filter(x => x != null || x != undefined) ?? []
      }
    }).filter(x => x.phoneNumbers.length != 0 || x.emails.length != 0);
    setimportedContacts(importedContacts)

    findExistingContacts(importedContacts);
  }
  const findExistingContacts = async (importedContacts: any) => {
    const response = await userManager.importUserContacts(importedContacts.map(x => {
      return { ...x, id: undefined, color: undefined, internalId: x.id }
    }));

    if (response.error != null) {
      console.error("Contact backend import error: ", response.error.message);
      pulseValue.value = 100;
      setExistingContacts([])
      return;
    }

    let mapOfContacts = new Set();
    for (let i = 0; i < response.result!.length; i++) {
      mapOfContacts.add(response.result![i].internalId);
    }

    pulseValue.value = 100;
    setimportedContacts(importedContacts.filter((x: any) => !mapOfContacts.has(x.id)))
    setExistingContacts(response.result!);
  }

  const handleAllowStep = async () => {
    const permission = await Contacts.getPermissionsAsync();
    if (!permission.granted) {
      if (permission.canAskAgain) {
        const result = await Contacts.requestPermissionsAsync();
        if (!result.granted) {
          setModalError("Permission was not granted")
          return;
        }
      }
      else {
        setModalError("Manual interaction required")
        Linking.openSettings();
        return;
      }
    }

    await importContacts();
    setModalOpen(false);
    startPulsing();
  }

  const handleUserSendFriendRequest = async (username: string, tag: string) => {
    const result = await userManager.sendUserFriendRequestByUsername(username, tag)
    if (result != null)
      return;

    setExistingContacts(prev => prev?.map(x => {
      if (x.username == username && x.tag == tag)
        return { ...x, friendRequestSent: true }

      return x;
    }))
  }

  const handleShareImportedUser = async (importedContact: ImportedContact) => {
    await Share.share({ message: shareMessage }, {
      dialogTitle: `Invite ${importedContact.firstName ?? importedContact.name} to Socigy`
    });
  }

  const handleNextStep = () => {
    router.push("/auth/(registration)/register-step-5");
  }

  const handleSkipStep = () => {
    router.push("/auth/(registration)/register-step-5");
  }

  return (
    <PageBase
      noScroll
      className="min-h-screen w-4/5 flex items-center self-center"
      wrapperChildren={
        <>
          {modalOpen &&
            <BlurView className="inset-0 absolute" tint="dark" intensity={45} style={{ zIndex: 15 }}>
              <View className="inset-0 absolute bg-bg-default/10 flex justify-center items-center text-center" style={{ zIndex: 30 }}>
                <View className="flex justify-center items-center border-2 border-bg-slim bg-bg-ultraslim py-10 px-5 mx-6 rounded-xl">
                  <AddContactsIcon height="108" width="110" fill={Colors[Theme]["text-primary"]} />
                  <View className="w-5/6 mb-6 mt-10">
                    <Text className="text-text-primary text-center font-inter-semibold text-2xl mb-2">Do you want to import your contacts?</Text>
                    <Text className="text-text-third text-center text-md">If you want to be connected with your closed ones right away. If so we're gonna need to have one time access to your contacts</Text>
                  </View>

                  {modalError && <Text className="text-red-500 mb-3 text-md">{modalError}</Text>}
                  <TouchableOpacity className="w-full text-center self-center bg-text-secondary rounded-md py-4 mb-4" onPress={handleAllowStep}>
                    <Text className="text-text-inverted text-center font-inter-semibold">Import Contacts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="w-full text-center self-center bg-bg-lighter rounded-md py-4 border-bg-slim border" onPress={handleSkipStep}>
                    <Text className="text-text-secondary text-center font-inter-semibold">Skip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          }
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
        </>
      }
    >
      <Heading
        title="Add your contacts to connect faster"
        description="Want to be connected to your friends right away and start enjoying together? Import your contacts and we will do the rest"
        className="h-1/4" />

      <Text className="-mt-3 text-text-primary font-inter-medium text-lg text-left w-full">People from your contacts</Text>
      {
        existingContacts ?
          existingContacts.length > 0 ?
            <ScrollView className="w-full pb-4 pt-3 mb-5" horizontal showsHorizontalScrollIndicator={false}>
              <View className="gap-x-4 w-full flex flex-row">
                {
                  existingContacts.map(x =>
                    <View key={x.username + x.tag} className="flex justify-center items-center py-5 px-5 gap-y-3 bg-bg-ultraslim border border-bg-slim rounded-lg" style={{ minWidth: 140 }}>
                      <View className="bg-text-primary w-14 h-14 rounded-full" />
                      <View className="grow">
                        <Text className="text-text-third">#{x.tag}</Text>
                        <Text className="text-text-secondary">{x.username}</Text>
                      </View>
                      <TouchableOpacity disabled={x.friendRequestSent} className="px-3 py-1 rounded-lg border border-bg-medium w-full mt-2 flex items-center justify-center" onPress={() => handleUserSendFriendRequest(x.username, x.tag)}>
                        {x.friendRequestSent ?
                          <CheckmarkIcon height="30" width="40" strokeWidth={3} fill={Colors[Theme]["text-primary"]} />
                          :
                          <PlusIcon height="30" width="40" strokeWidth={3} fill={Colors[Theme]["text-primary"]} />
                        }
                      </TouchableOpacity>
                    </View>
                  )
                }
              </View>
            </ScrollView>
            :
            <View className="grow w-full mt-3">
              <Text className="text-text-third leading-normal">It looks like you're the only one from your close ones.{' '}<Text className="font-inter-medium">What about inviting someone?</Text></Text>
              <View className="flex justify-center items-center py-5 px-5 gap-y-3 bg-transparent rounded-lg">
                <View className="w-14 h-14 rounded-full flex justify-center items-center">
                </View>
                <View className="grow">
                  <Text className="text-text-third"></Text>
                </View>
                <TouchableOpacity className="px-3 py-1 rounded-lg bg-transparent w-full mt-2 flex items-center justify-center">
                  <ShareIcon height="30" width="15" fill={'none'} />
                </TouchableOpacity>
              </View>
            </View>
          :
          <View className="grow w-full mt-3">
            <Animated.Text className="text-text-third" style={{ opacity: pulseStyle.opacity }}>Searching for your contacts on our platform...</Animated.Text>
            <View className="flex justify-center items-center py-5 px-5 gap-y-3 bg-transparent rounded-lg">
              <View className="w-14 h-14 rounded-full flex justify-center items-center">
              </View>
              <View className="grow">
                <Text className="text-text-secondary"></Text>
                <Text className="text-text-third"></Text>
              </View>
              <TouchableOpacity className="px-3 py-1 rounded-lg bg-transparent w-full mt-2 flex items-center justify-center">
                <ShareIcon height="30" width="15" fill={'none'} />
              </TouchableOpacity>
            </View>
          </View>
      }

      <View className="w-full">
        <Text className="-mt-3 text-text-primary font-inter-medium text-lg text-left w-full">More people from your contacts...</Text>
        <ScrollView className="w-full pb-4 pt-3 mb-2" horizontal showsHorizontalScrollIndicator={false}>
          <View className="gap-x-4 w-full flex flex-row">
            {
              importedContacts ?
                importedContacts.length > 0 ?
                  importedContacts.map(x =>
                    <View key={x.id} className="flex justify-center items-center py-5 px-5 gap-y-3 bg-bg-ultraslim border border-bg-slim rounded-lg">
                      <View className="w-14 h-14 rounded-full flex justify-center items-center" style={{ backgroundColor: x.color }}>
                        <Text className="text-center font-inter-semibold text-xl">{x.name[0].toUpperCase()}</Text>
                      </View>
                      <View className="grow">
                        <Text className="text-text-secondary">{x.name}</Text>
                        <Text className="text-text-third">{x.phoneNumbers.length > 0 ? x.phoneNumbers[0].number : x.emails[0]}</Text>
                      </View>
                      <TouchableOpacity className="px-3 py-1 rounded-lg border border-bg-medium w-full mt-2 flex items-center justify-center" onPress={() => handleShareImportedUser(x)}>
                        <ShareIcon height="30" width="15" fill={Colors[Theme]["text-primary"]} />
                      </TouchableOpacity>
                    </View>
                  )
                  :
                  <Text className="text-text-primary">Nobody from your contacts is here yet, let's invite them!</Text>
                :
                <Text className="text-text-primary">Importing...</Text>
            }
          </View>
        </ScrollView>
      </View>

      <View className="flex grow w-full justify-end">
        <View className="w-full flex flex-row -mb-3 items-center">
          <Text className="text-text-primary text-left grow">Send friend requests to all existing accounts</Text>
          <CheckBox
            value={shouldSelectAll}
            onValueChange={setShouldSelectAll}
          />
        </View>
        <NextStep onPress={handleNextStep} stepCurrent={4} stepMax={5} />
      </View>
    </PageBase >
  );
}