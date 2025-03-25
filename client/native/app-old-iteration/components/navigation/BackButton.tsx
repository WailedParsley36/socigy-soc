import { Theme, Colors } from "@/constants/Colors";
import { NavigationProp } from "@react-navigation/native";
import { Href, router } from "expo-router";
import ArrowBackIcon from "../icons/ArrowBackIcon";
import { IconProps } from "../icons/icon-base";
import { TouchableOpacity } from "react-native-gesture-handler";

interface Props extends IconProps {
    fallbackRoute: Href
    resets?: boolean
    navigation?: NavigationProp<ReactNavigation.RootParamList>,
    shouldSetNavbar?: boolean
    navbarVisibilityFunc?: () => void
}

export function BackButton({ navigation, resets = false, shouldSetNavbar, navbarVisibilityFunc, fallbackRoute, height = '40', width = '40', strokeWidth = 2.5, fill = Colors[Theme]["text-primary"], ...rest }: Props) {
    const handleBack = () => {
        if (resets) {
            navigation?.reset({
                index: 0,
                routes: [{
                    name: fallbackRoute as never
                }]
            })
        }
        else if (router.canGoBack()) {
            router.back();
        }
        else {
            router.replace(fallbackRoute)
        }

        if (shouldSetNavbar) {
            navbarVisibilityFunc!();
        }
    }

    return <TouchableOpacity activeOpacity={.75} onPress={handleBack}>
        <ArrowBackIcon height={height} width={width} strokeWidth={strokeWidth} fill={fill} {...rest} />
    </TouchableOpacity>
}