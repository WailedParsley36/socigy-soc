import React from "react";
import { GestureResponderEvent, Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface NextStepProps extends TouchableOpacityProps {
    onPress: (event: GestureResponderEvent) => void
    title?: string
    stepCurrent: number
    stepMax: number,
    skip?: boolean,
    onSkip?: () => void
}

export default function NextStep({ onPress: handleNextStep, title = "Next step →", stepMax, stepCurrent, skip, onSkip }: NextStepProps) {
    return <>
        <TouchableOpacity className="bg-text-primary text-text-inverted py-5 px-10 rounded-lg w-full mt-6" onPress={handleNextStep}>
            <Text className="text-center font-inter-bold text-lg">{title}</Text>
        </TouchableOpacity>
        {skip && <Text className="text-text-primary underline mt-3" onPress={onSkip}>Skip this step</Text>}
        <Text className="text-text-primary text-center mt-5 mb-10 font-inter-regular">
            Step {stepCurrent} of {stepMax}
        </Text>
    </>
}