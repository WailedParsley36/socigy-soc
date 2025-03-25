import Svg, { Path, Rect } from "react-native-svg";
import { IconProps } from "./icon-base";

export default function PlusIcon({ fill, strokeWidth = 1.5, ...rest }: IconProps) {
    return (
        <Svg viewBox="0 0 42 32" fill="none" {...rest}>
            <Path d="M27 16H15" stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M21 22V10" stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}