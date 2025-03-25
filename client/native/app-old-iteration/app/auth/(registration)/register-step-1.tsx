import { Colors, Theme } from "@/constants/Colors";
import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import FacebookLogoIcon from "@/components/icons/FacebookLogoIcon";
import FemaleIcon from "@/components/icons/FemaleIcon";
import GoogleLogoIcon from "@/components/icons/GoogleLogoIcon";
import MaleIcon from "@/components/icons/MaleIcon";
import PageBase from "@/components/PageBase";
import { Link, router } from "expo-router";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { clsx } from 'clsx'
import { useEffect, useState } from "react";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import Heading from "@/components/registration/Heading";
import NextStep from "@/components/registration/NextStep";
import { useAuthManager } from "@/managers/Exports";


const inlineGenderSettings = [
  [
    {
      name: "Male",
      internalValue: "male",
      icon: <MaleIcon height="100%" width="12" fill="white" />,
      width: "w-5/12 inline"
    },
    {
      name: "Female",
      internalValue: "female",
      icon: <FemaleIcon height="85%" width="12" fill="white" />,
      width: "w-5/12 inline"
    },
  ]
]

const genderSettings = [
  {
    internalValue: "other",
    name: "Other",
  },
  {
    internalValue: "undisclosed",
    name: "Prefer not to say",
  }
]

const now = new Date(Date.now());
now.setUTCHours(0);
now.setUTCMinutes(0);
now.setUTCSeconds(0);
now.setUTCMilliseconds(0);

const maxDate = new Date(now.setUTCFullYear(now.getUTCFullYear() - 3));
const childDate = new Date(now.setUTCFullYear(now.getUTCFullYear() - 13));
const minDate = new Date(now.setUTCFullYear(now.getUTCFullYear() - 84));

export default function RegisterStep() {
  const authManager = useAuthManager();

  const [date, setDate] = useState(maxDate)
  const [open, setOpen] = useState(false)

  const [gender, setGender] = useState<string>("undisclosed");
  const [error, setError] = useState<string>();

  const handleDateChange = (event: any) => {
    setOpen(false)

    if (event.type == "dismissed")
      return;

    setDate(new Date(event.nativeEvent.timestamp));
  }

  const handleNextStep = async () => {
    console.log("STEP 2 - REGISTER");
    const result = await authManager.registerBirthAndGender(date, gender);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.result)
      router.push('/auth/(registration)/register-step-child')
    else
      router.push('/auth/(registration)/register-step-2')
  }

  return (
    <PageBase
      className="min-h-screen flex items-center w-4/5 self-center"
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
        title="Let's finish creating your account"
        description="Before we let you in, we need to know more things about you. Don't worry you can change these later"
        className="h-1/4" />

      <View className="flex flex-col">
        <View className="w-full mb-3" onTouchStart={() => { setOpen(true) }}>
          <Text className="text-text-primary font-inter-medium mb-2">
            Date of Birth{" "}
            <Text className="text-red-500 font-inter-extrabold">*</Text>
          </Text>
          {open && <DatePicker date={date} handleDateChange={handleDateChange} minDate={minDate} maxDate={maxDate} />}
          <View className="w-full">
            <Text className="text-xl absolute text-red-500 left-4 top-4 bottom-4">
              #
            </Text>
            <Text className="text-text-secondary border-2 border-bg-ultraslim font-inter-light pl-12 py-4 rounded-xl">{date.toDateString()}</Text>
            <Text className="text-xl absolute text-red-500 right-4 top-4 bottom-4">
              G
            </Text>
          </View>
        </View>

        <Text className="text-text-third font-inter-regular text-center text-sm mb-10">
          You cannot create an account without your parents if you're under 16
          years old in EU.{" "}
          <Link
            href="https://socigy.com/privacy-policy"
            className="font-inter-extrabold"
          >
            Learn More
          </Link>
        </Text>

        <View className="mb-3">
          <Text className="text-text-primary font-inter-medium mb-2">
            Gender
          </Text>
          <View className="flex w-full gap-y-4">
            {inlineGenderSettings.map((inlineGenders, index) => (
              <View className="flex flex-row" key={index}>
                {inlineGenders.map((x, index) => (
                  <TouchableOpacity
                    key={x.internalValue}
                    className={clsx("border-2 grow p-4 rounded-xl flex flex-row gap-x-2 justify-center items-center", x.width, gender == x.internalValue ? "border-text-third" : "border-bg-ultraslim")}
                    style={{ marginRight: (!x.width || index % 2 != 0) ? "0%" : "8.333333%" }}
                    onPress={(e) => setGender(x.internalValue)}>
                    {x.icon != undefined ? x.icon : undefined}
                    <Text className="text-text-secondary font-inter-regular">
                      {x.name}
                    </Text>
                  </TouchableOpacity>)
                )}
              </View>
            ))}

            {genderSettings.map((x, index) => (
              <TouchableOpacity
                key={x.internalValue}
                className={clsx("border-2 p-4 rounded-xl flex flex-row gap-x-2 justify-center items-center", gender == x.internalValue ? "border-text-third" : "border-bg-ultraslim")}
                onPress={(e) => setGender(x.internalValue)}>
                <Text className="text-text-secondary font-inter-regular">
                  {x.name}
                </Text>
              </TouchableOpacity>))}
          </View>
        </View>
        <Text className="text-text-third font-inter-regular text-center text-sm mb-8">
          This will not be shared with others, unless you enable it in the{" "}
          <Link
            href="https://socigy.com/privacy-policy"
            className="font-inter-extrabold"
          >
            Privacy Settings
          </Link>
        </Text>
      </View>

      {error && <Text className="text-red-500">{error}</Text>}
      <NextStep onPress={handleNextStep} stepCurrent={1} stepMax={5} />
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


function DatePicker({ date, handleDateChange, minDate, maxDate }) {
  return Platform.select({
    web: <input type='date' value={date} min={minDate} max={maxDate} onChange={handleDateChange} />,
    default: <RNDateTimePicker mode='date' value={date} onChange={handleDateChange} positiveButton={{ label: "Set" }} negativeButton={{ label: 'Cancel' }} onError={() => console.log("ERROR, Date")} maximumDate={maxDate} minimumDate={minDate} />
  })
}