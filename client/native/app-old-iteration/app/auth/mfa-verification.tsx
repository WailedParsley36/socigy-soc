import CircleBackground from "@/components/background/assets/CircleBackground";
import ElipseBackground from "@/components/background/assets/ElipseBackground";
import RefreshIcon from "@/components/icons/RefreshIcon";
import SocigyLogoIcon from "@/components/icons/SocigyLogoIcon";
import CheckBox from "@/components/input/CheckBox";
import PageBase from "@/components/PageBase";
import { Colors, Theme } from "@/constants/Colors";
import { AppState } from "@/managers/BaseManager";
import { useAuth } from "@/managers/Exports";
import clsx from "clsx";
import { Href, Link, Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { red } from "react-native-reanimated/lib/typescript/Colors";

const baseTime = 60;

export default function MFAVerification() {
    const auth = useAuth();
    const { redirectTo } = useLocalSearchParams();

    const [timeLeft, setTimeLeft] = useState<number>(baseTime);
    const [currentTimerId, setCurrentTimerId] = useState<NodeJS.Timeout>();

    const [pinCode, setPinCode] = useState<string>();
    const [trustThisDevice, setTrustThisDevice] = useState<boolean>(false)

    const [error, setError] = useState<string>();

    const restartTimer = () => {
        if (currentTimerId)
            clearInterval(currentTimerId)

        if (timeLeft != baseTime)
            setTimeLeft(baseTime);

        const id = setInterval(() => {
            setTimeLeft(prev => {
                if (prev - 1 == 0 || prev == 0 || prev < 0) {
                    setTimeLeft(0)
                    clearInterval(id)
                    setCurrentTimerId(undefined);
                    return 0;
                }

                return (prev - 1)
            })
        }, 1000);

        setCurrentTimerId(id)
    }

    useEffect(() => {
        restartTimer()
    }, [])

    const handleContinue = async () => {
        const error = await auth.manager.verifyEmailWithCode(pinCode!, trustThisDevice);
        if (error) {
            setError(error.message);
            return;
        }

        router.replace(redirectTo as Href);
    }

    const handleResendCode = async () => {
        const error = await auth.manager.resendEmailCode();
        if (error)
            setError(error.message);

        restartTimer()
    }

    if (!redirectTo || auth.state != AppState.MFA) {
        return <Redirect href="/auth" />
    }

    return (
        <PageBase
            className="min-h-screen flex items-center w-4/5 self-center py-24"
            wrapperChildren={
                <View className="h-1/2 overflow-hidden">
                    <CircleBackground
                        width="75%"
                        height="100%"
                        fill={Colors[Theme]["text-secondary"]}
                        fillSecond={Colors[Theme]["bg-default"]}
                        className="absolute top-0 left-0"
                        style={{
                            transform: [{ translateX: "-40%" }, { translateY: "-20%" }],
                        }}
                        x1={40}
                        x2={150}
                        y2={300}
                    />
                    <ElipseBackground
                        width="125%"
                        height="75%"
                        fill={Colors[Theme]["text-secondary"]}
                        fillSecond={Colors[Theme]["bg-default"]}
                        className="absolute top-0 right-0"
                        style={{
                            transform: [{ translateX: "25%" }, { translateY: "-100%" }],
                        }}
                        x2={20}
                        y2={100}
                    />
                </View>
            }
        >
            <View className="w-full max-h-12 grow flex">
                <View className="max-h-12 mb-auto">
                    <SocigyLogoIcon height="100%" width="100%" fill="white" />
                </View>
            </View>

            <View className={clsx("flex justify-end h-1/2", timeLeft == 0 ? "-mt-14" : "-mt-8")}>
                <Text className="text-text-primary font-inter-extrabold text-4xl mb-4">
                    Looks like this isn't a trusted device
                </Text>
                <Text className="text-text-third mb-6 font-inter-regular">
                    To be sure that this is really you trying to get in. Please input code that was sent to your email {auth.manager.currentUser?.email}
                </Text>
            </View>

            <OTPInput
                className="mb-6 mt-10"
                isInvalid={error != undefined}
                pinLength={6}
                onChange={value => {
                    if (value.length == 6)
                        setPinCode(value)
                    else
                        setPinCode(undefined)

                    setError(undefined)
                }}
                onComplete={value => setPinCode(value)}
            />

            {timeLeft > 0 ?
                <Text className="text-text-third">Resend in {timeLeft}s</Text>
                :
                <TouchableOpacity className="flex flex-row justify-center bg-bg-ultraslim px-6 py-4 rounded-lg" onPress={handleResendCode}>
                    <RefreshIcon height="22" width="22" strokeWidth={2} fill={Colors[Theme]["text-secondary"]} />
                    <Text className="text-text-secondary text-center ml-4 align-middle">Resend code</Text>
                </TouchableOpacity>
            }


            <View className="w-full flex flex-row align-middle mt-10">
                <Text className="text-text-primary grow align-middle">Trust this device next time:</Text>
                <CheckBox value={trustThisDevice} onValueChange={value => setTrustThisDevice(value)} />
            </View>
            <TouchableOpacity className={clsx("text-text-inverted py-5 px-10 rounded-lg w-full mt-4", pinCode ? "bg-text-primary" : "bg-bg-medium")} onPress={handleContinue} disabled={!pinCode}>
                <Text className="text-center font-inter-bold text-lg">Continue →</Text>
            </TouchableOpacity>
            {error && <Text className="text-red-500 text-center w-full mt-3 -mb-5">{error}</Text>}
            <Link href={'/'} replace className=" underline text-text-secondary mt-8 text-lg">Try another way</Link>
            <Text className=" underline text-text-secondary mt-5" onPress={() => {
                if (router.canGoBack())
                    router.back();
                else if (router.canDismiss())
                    router.dismissTo("/auth");
                else
                    router.replace("/auth")
            }}>Back to sign in</Text>
        </PageBase>
    );
}

interface OTPProps {
    className: string,
    pinLength: number;
    value?: string;
    isInvalid?: boolean;
    onComplete: (value: string) => void;
    onChange?: (value: string) => void;
}

const OTPInput = ({ pinLength = 6, value, onComplete, onChange, className, isInvalid = false, ...rest }: OTPProps) => {
    const [otp, setOtp] = useState<string[]>(
        value?.split("") ?? new Array(pinLength).fill("")
    );
    const inputs = useRef<TextInput[]>([]);

    const handleChange: (value: string, index: number) => void = (
        value,
        index
    ) => {
        const newOtp = [...otp];
        newOtp[index] = value;

        setOtp(newOtp);

        // If all fields are filled, call onComplete
        if (newOtp.every((digit) => digit !== "")) {
            onComplete(newOtp.join(""));
        } else if (onChange) onChange(newOtp.join(""));

        // Move focus to the next input if not the last field
        if (value && index < pinLength - 1) {
            inputs.current[index + 1].focus();
        }
    };

    const handleBackspace: (value: string, index: number) => void = (
        value,
        index
    ) => {
        if (!value && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    return (
        <View className={clsx("flex flex-row justify-center w-full", className)} {...rest}>
            {otp.map((_, index) => (
                <TextInput
                    key={index}
                    className={clsx("border-2 rounded-lg py-4 w-14 mx-1.5 text-center text-lg font-inter-medium text-text-primary", isInvalid ? "border-red-900" : "border-bg-lighter")}
                    value={otp[index]}
                    onChangeText={(x) => handleChange(x, index)}
                    onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace") {
                            handleBackspace(otp[index], index);
                        }
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    ref={(ref) => (inputs.current[index] = ref!)}
                />
            ))}
        </View>
    );
};