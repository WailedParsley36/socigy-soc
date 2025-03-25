import Svg, { Path } from "react-native-svg";
import { IconProps, TabBarIconProps } from "./icon-base";

export default function CreateIcon({ fill, strokeWidth = 1.5, filled, ...rest }: TabBarIconProps) {
    if (filled)
        strokeWidth = Number(strokeWidth.valueOf()) + 0.5

    return (
        <Svg viewBox="0 0 24 24" fill="none" {...rest}>
            <Path d="M2.40039 12.8H21.6004" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 22.4002V3.2002" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}