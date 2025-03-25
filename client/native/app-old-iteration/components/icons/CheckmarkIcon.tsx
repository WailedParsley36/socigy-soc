import Svg, { Path } from "react-native-svg";
import { IconProps } from "./icon-base";

export default function CheckmarkIcon({ fill, strokeWidth = 1.5, ...rest }: IconProps) {
    return <Svg viewBox="0 0 6 4" fill='none' {...rest}>
        <Path d="M1.44141 1.99951L2.43141 2.9895L4.56141 1.01953" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
}