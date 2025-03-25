import Svg, { Path } from "react-native-svg";
import { IconProps, TabBarIconProps } from "./icon-base";
import { TabInnerProps } from "../navigation/TabBar";

export default function AddContactsIcon({ fill, strokeWidth = 1.5, filled, ...rest }: TabBarIconProps) {
    if (filled)
        strokeWidth = Number(strokeWidth.valueOf()) + 0.5

    return (
        <Svg viewBox="0 0 24 24" fill="none" {...rest}>
            <Path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M22 22L20 20" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}