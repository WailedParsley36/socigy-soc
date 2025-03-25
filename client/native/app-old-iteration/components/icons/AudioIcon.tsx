import Svg, { Path } from "react-native-svg";
import { IconProps } from "./icon-base";

export default function AudioIcon({ fill, strokeWidth, ...rest }: IconProps) {
    return <Svg viewBox="0 0 47 40" fill="none" {...rest}>
        <Path d="M2.87671 12.7617V27.7431" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13.3525 7.76855V32.7025" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M23.8289 2.77441V37.6958" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M34.3069 7.76855V32.7025" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M44.7832 12.7617V27.7431" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>

}