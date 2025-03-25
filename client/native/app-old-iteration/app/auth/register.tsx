import { Colors, Theme } from "@/constants/Colors";
import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import FacebookLogoIcon from "@/components/icons/FacebookLogoIcon";
import GoogleLogoIcon from "@/components/icons/GoogleLogoIcon";
import PageBase from "@/components/PageBase";
import Heading from "@/components/registration/Heading";
import { Link, router, useNavigation } from "expo-router";
import { NativeSyntheticEvent, StyleSheet, Text, TextInput, TextInputChangeEventData, TouchableOpacity, View } from "react-native";
import { createAsync } from 'expo-passkeys'
import { useAuth } from "@/managers/Exports";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { BasicRegistrationResponse, PasskeyChallengeResponse } from "@/data/api/responses/BasicRegistration";

export default function Register() {
  const auth = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    async function healthCheck() {
      console.log("Checking Auth Service health")

      if (await auth.manager.healthCheck())
        console.log("Auth service is healthy")
      else
        console.error("Auth service is not healthy");
    }

    healthCheck();
  }, [])

  const [email, setEmail] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [fullName, setFullName] = useState<string>();
  const [tag, setTag] = useState<string>();
  const [tagRecommendation, setTagRecommendation] = useState<string[]>();

  const [onlyPasskey, setOnlyPasskey] = useState<PasskeyChallengeResponse>();

  const [error, setError] = useState<{ message?: string, element: number }>();

  const handleEmailChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setEmail(e.nativeEvent.text);
  }

  const handleFullNameChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setFullName(e.nativeEvent.text);
    if (e.nativeEvent.text.length > 3 && error?.element == 3)
      setError(undefined);
  }

  const handleUsernameChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    if (e.nativeEvent.text.length > 0 && error?.element == 1)
      setError(undefined)

    setUsername(e.nativeEvent.text);
  }

  const handleUsernameEndEditing = async () => {
    if ((username?.length ?? 0) == 0)
      return;

    const tags = await auth.manager.recommendTags(username, 4);
    setTagRecommendation(tags);

    if ((tag?.length ?? 0) == 0)
      setTag(tags?.at(0) ?? "0000");
  }

  const handleTagChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setTag(e.nativeEvent.text);
  }

  const handleTagEndEditing = async () => {
    if (!auth.manager.checkTagAvailability(username, tag))
      setError({ message: "This tag is not available", element: 2 })
    else
      setError(undefined);
  }

  const handleNextStep = async () => {
    if (onlyPasskey) {
      const resultPasskey = await auth.manager.registerPasskeyAsync(onlyPasskey.challenge, onlyPasskey.user, onlyPasskey.relayingParty)
      if (resultPasskey != null) {
        setError({ message: resultPasskey.error == "USER_CANCELLED" ? "You must register a passkey. Please try again" : resultPasskey.error, element: 0 });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "auth/mfa-verification" as never, params: { redirectTo: "/auth/register-step-1" } }]
      })
      return;
    }

    if (!username || username.length == 0) {
      setError({ element: 1 })
      return;
    }
    else if (!tag || tag.length != 4) {
      setError({ element: 2 })
      return;
    }
    else if (!await auth.manager.checkTagAvailability(username, tag)) {
      setError({ message: "This tag is not available", element: 2 });
      return;
    }
    else if (!fullName || fullName.length < 3) {
      setError({ element: 3 })
      return;
    }
    else if (!email || !auth.manager.isValidEmail(email)) {
      setError({ element: 4 });
      return;
    }

    const result = await auth.manager.registerBasic(username, Number.parseInt(tag), fullName, email);
    if (result.error != null) {
      if (result.error.message.includes("email"))
        setError({ message: result.error.message, element: 4 })
      else if (result.error.message.includes("full name"))
        setError({ message: result.error.message, element: 3 })
      else if (result.error.message.includes("tag"))
        setError({ message: result.error.message, element: 2 })
      else if (result.error.message.includes("username"))
        setError({ message: result.error.message, element: 1 })
      else
        setError({ message: result.error.message, element: 0 })
      return;
    }

    setOnlyPasskey({ challenge: result.result!.challenge, relayingParty: result.result!.relayingParty, user: result.result!.user })
    console.log("PASSKEYYYYY");
    const passkeyResult = await auth.manager.registerPasskeyAsync(result.result!.challenge, result.result!.user, result.result!.relayingParty)
    if (passkeyResult != null) {
      setError({ message: passkeyResult.error == "USER_CANCELLED" ? "You must register a passkey. Please try again" : passkeyResult.error, element: 0 });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "auth/mfa-verification" as never, params: { redirectTo: "/auth/register-step-1" } }]
    })
  }

  return (
    <PageBase
      className="min-h-screen flex items-center w-4/5 self-center"
      wrapperChildren={(
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
      )}
    >
      <Heading
        title="Let's get you started on your journey"
        description="We're building a space where users have full control over their experience."
        className="h-1/4" />

      <View className="flex flex-col -mt-5 z-10 w-full">
        <View className="flex flex-row mb-3">
          <View className="w-7/12" style={{ marginRight: "8.333333%" }}>
            <Text className="text-text-primary font-inter-medium mb-2">Username <Text className="text-red-500 font-inter-extrabold">*</Text></Text>
            <TextInput className={clsx("text-text-secondary border-2 border-bg-ultraslim font-inter-light p-4 rounded-xl", error?.element == 1 && "border-red-900")} inputMode='text' onChange={handleUsernameChange} onEndEditing={handleUsernameEndEditing} />
          </View>
          <View className="w-4/12">
            <Text className="text-text-primary font-inter-medium mb-2">Tag <Text className="text-red-500 font-inter-extrabold">*</Text></Text>
            <View>
              <Text className="text-text-secondary text-xl absolute left-4 top-4">#</Text>
              <TextInput className={clsx("text-text-secondary border-2 border-bg-ultraslim font-inter-light p-4 pl-9 rounded-xl", error?.element == 2 && "border-red-900")} inputMode='numeric' maxLength={4} value={tag} onChange={handleTagChange} onEndEditing={handleTagEndEditing} />
            </View>
          </View>
        </View>
        <View className="mb-3">
          <Text className="text-text-primary font-inter-medium mb-2">Full Name <Text className="text-red-500 font-inter-extrabold">*</Text></Text>
          <TextInput className={clsx("text-text-secondary border-2 border-bg-ultraslim font-inter-light p-4 rounded-xl", error?.element == 3 && "border-red-900")} inputMode='text' onChange={handleFullNameChange} />
        </View>
        <View className="mb-8">
          <Text className="text-text-primary font-inter-medium mb-2">Email <Text className="text-red-500 font-inter-extrabold">*</Text></Text>
          <TextInput className={clsx("text-text-secondary border-2 border-bg-ultraslim font-inter-light p-4 rounded-xl", error?.element == 4 && "border-red-900")} inputMode='email' onChange={handleEmailChange} />
        </View>

        {error && error.message &&
          <Text className="text-red-500 text-center mb-3">{error?.message}</Text>
        }
        <TouchableOpacity className="bg-text-primary text-text-inverted py-5 px-10 rounded-lg w-full" onPress={handleNextStep}>
          <Text className="text-center font-inter-bold">
            Continue with the next step →
          </Text>
        </TouchableOpacity>

        <View className="w-11/12 text-center flex justify-center items-center mx-auto mt-6 gap-y-4">
          <Text className="text-text-third font-inter-regular text-center text-sm">
            By signing up, you agree to our <Link href='https://socigy.com/terms-of-use' className="font-inter-extrabold">Terms of Use</Link>. Learn how we collect, use and share your data in our <Link href='https://socigy.com/cookies-policy' className="font-inter-extrabold">Privacy Policy</Link>
          </Text>
        </View>

        <View className="flex flex-row justify-center items-center mt-6">
          <View style={styles.divider} />
          <Text className="text-bg-light font-inter-semibold mx-4">
            Or sign up with
          </Text>
          <View style={styles.divider} />
        </View>

        <View className="flex flex-row justify-center items-center mt-10 gap-x-8">
          <TouchableOpacity className="border border-bg-slim flex flex-row items-center justify-center px-10 py-5 rounded-xl">
            <GoogleLogoIcon width="15" height="15" />
            <Text className="text-text-primary ml-4">Google</Text>
          </TouchableOpacity>
          <TouchableOpacity className="border border-bg-slim flex flex-row items-center justify-center px-8 py-5 rounded-2xl">
            <FacebookLogoIcon width="20" height="20" />
            <Text className="text-text-primary ml-4">Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-text-primary text-center mt-10 mb-10">Already have an account? {' '}<Text className="font-inter-extrabold underline" onPress={() => {
        if (router.canGoBack())
          router.back();
        else if (router.canDismiss())
          router.dismissTo('/auth')
        else
          router.replace('/auth')
      }}>Sign in</Text></Text>
    </PageBase>
  );
}

const styles = StyleSheet.create({
  divider: {
    borderBottomColor: Colors[Theme]["bg-light"], borderBottomWidth: 1, flex: 1
  }
})