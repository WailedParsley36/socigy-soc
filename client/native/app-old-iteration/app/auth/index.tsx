import { Colors, Theme } from "@/constants/Colors";
import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import FacebookLogoIcon from "@/components/icons/FacebookLogoIcon";
import GoogleLogoIcon from "@/components/icons/GoogleLogoIcon";
import PasskeyIcon from "@/components/icons/PasskeyIcon";
import SocigyLogoIcon from "@/components/icons/SocigyLogoIcon";
import PageBase from "@/components/PageBase";
import { Link, RelativePathString, router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";
import AppInfo from "@/constants/AppInfo";
import { useAuth } from "@/managers/Exports";
import { clsx } from "clsx";
import { PasskeyChallengeInfo } from "@/data/api/responses/PasskeyChallengeResponse";
import React from "react";

export default function Index() {
  const auth = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState<string>();
  const [error, setError] = useState<{ message: string; element: number }>();

  const [onlyPasskey, setOnlyPasskey] = useState<PasskeyChallengeInfo>();

  const handleEmailChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>
  ) => {
    setEmail(e.nativeEvent.text);
  };

  const handleSignIn = async () => {
    if (onlyPasskey) {
      // TODO: Handle the possibility that the sign in will require MFA
      const finalResult = await auth.manager.signInAsync(onlyPasskey);
      if (finalResult.error != null) {
        setError({ message: finalResult.error!.message, element: 0 });
        return;
      }

      if (finalResult.result?.mfa == true) {
        console.log("EMAIL MFA");
        router.replace(
          ("/auth/mfa-verification?redirectTo=" +
            (finalResult.result?.registration == true
              ? "/auth/register-step-1"
              : "/app")) as RelativePathString
        );
        return;
      }

      if (finalResult.result?.registration == true) {
        console.log("REGISTRATION NOT COMPLETE");
        router.replace("/auth/register-step-1");
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "app" as never }],
      });
      return;
    }

    // TODO: Make the email/username x tag/phone text input carousel and sign in endpoint in Auth Microservice Backend
    if (!email || email.length < 3 || !auth.manager.isValidEmail(email)) {
      setError({ message: "Please provide valid email", element: 1 });
      return;
    }

    const signInChallengeInfo = await auth.manager.signInChallengeAsync(email);
    if (signInChallengeInfo.error) {
      if (
        signInChallengeInfo.error.error ==
        "ERROR_USER_REGISTRATION_NOT_COMPLETE"
      ) {
        router.replace("/auth/(registration)/register-step-1");
        return;
      }

      setError({ message: signInChallengeInfo.error.message, element: 0 });
      return;
    }

    if (signInChallengeInfo.result?.mfaRequired) {
      console.log("EMAIL MFA");
      router.replace("/auth/mfa-verification?redirectTo=/app");
      return;
    }

    setOnlyPasskey(signInChallengeInfo.result);

    // TODO: Handle the possibility that the sign in will require MFA
    const finalResult = await auth.manager.signInAsync(
      signInChallengeInfo.result!
    );
    if (finalResult.error != null) {
      setError({ message: finalResult.error!.message, element: 0 });
      return;
    }

    if (finalResult.result?.mfa == true) {
      console.log("EMAIL MFA");
      router.replace(
        ("/auth/mfa-verification?redirectTo=" +
          (finalResult.result?.registration == true
            ? "/auth/register-step-1"
            : "/app")) as RelativePathString
      );
      return;
    }

    if (finalResult.result?.registration == true) {
      console.log("REGISTRATION NOT COMPLETE");
      router.replace("/auth/register-step-1");
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "app" as never }],
    });
  };

  return (
    <PageBase
      className="min-h-screen flex items-center justify-center py-24 w-4/5 self-center"
      wrapperChildren={
        <>
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
              transform: [{ translateX: "95%" }, { translateY: "-90%" }],
            }}
            x2={0}
            y2={0}
          />
        </>
      }
    >
      <View className="w-full grow flex">
        <View className="max-h-12 mb-auto">
          <SocigyLogoIcon height="100%" width="100%" fill="white" />
        </View>
      </View>
      <View>
        <Text className="text-text-primary font-inter-extrabold text-4xl mb-4">
          Let's continue in your journey
        </Text>
        <Text className="text-text-third mb-6">
          We're building a space where users have full control over their
          experience.
        </Text>
        <View className="flex flex-col mt-6">
          <View className="mb-8">
            <Text className="text-text-primary font-inter-medium mb-2">
              Email <Text className="text-red-500 font-inter-extrabold">*</Text>
            </Text>
            <TextInput
              className={clsx(
                "text-text-secondary border-2 border-bg-ultraslim font-inter-light p-4 rounded-xl",
                error?.element == 1 && "border-red-900"
              )}
              inputMode="email"
              onChange={handleEmailChange}
            />
          </View>
          {error && error.message && (
            <Text className="text-red-500 text-center mb-3">
              {error?.message}
            </Text>
          )}
          <TouchableOpacity
            className="bg-text-primary text-text-inverted py-5 px-10 flex flex-row rounded-lg items-center justify-center"
            onPress={handleSignIn}
          >
            <PasskeyIcon
              height="24"
              width="24"
              fill={Colors[Theme]["text-inverted"]}
            />
            <Text className="text-center font-inter-bold ml-4">
              Continue with passkey
            </Text>
          </TouchableOpacity>

          <View className="flex flex-row justify-center items-center mt-12">
            <View style={styles.divider} />
            <Text className="text-bg-light font-inter-semibold mx-4">
              Or login with
            </Text>
            <View style={styles.divider} />
          </View>

          <View className="flex flex-row justify-center items-center mt-12 gap-x-8">
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
      </View>
      <Text className="text-text-primary text-center mt-20 -mb-10">
        Don't have an account?{" "}
        <Link
          href="/auth/register"
          push
          className="font-inter-extrabold underline"
        >
          Register
        </Link>
      </Text>
    </PageBase>
  );
}

const styles = StyleSheet.create({
  divider: {
    borderBottomColor: Colors[Theme]["bg-light"],
    borderBottomWidth: 1,
    flex: 1,
  },
});
