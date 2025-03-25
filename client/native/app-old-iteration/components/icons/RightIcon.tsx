import Svg, { Path } from "react-native-svg";
import { IconProps } from "./icon-base";

export default function RightIcon({ fill, ...rest }: IconProps) {
    return <Svg viewBox="0 0 13 22" fill='none' {...rest}>
        <Path d="M3.19507 18.84L9.71507 12.32C10.4851 11.55 10.4851 10.29 9.71507 9.52L3.19507 3" stroke={fill} strokeWidth="5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
}