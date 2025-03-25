import Svg, { Path } from "react-native-svg";
import { IconProps } from "./icon-base";

export default function ArrowBackIcon({ fill, strokeWidth, ...rest }: IconProps) {
    return <Svg viewBox="0 0 24 24" fill="none" {...rest}>
        <Path d="M9.57 5.92969L3.5 11.9997L9.57 18.0697" stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M20.4999 12H3.66992" stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>

}