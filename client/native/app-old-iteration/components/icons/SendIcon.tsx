import Svg, { Path } from "react-native-svg";
import { IconProps } from "./icon-base";
import { ColorValue } from "react-native";

interface SendIconProps extends IconProps {
    fillSecond?: ColorValue
}

export default function SendIcon({ fill, fillSecond, ...rest }: SendIconProps) {
    return (
        <Svg viewBox="0 0 21 20" fill="none" {...rest}>
            <Path d="M8.47159 4.08582L15.3453 7.51783C18.4288 9.05742 18.4288 11.5753 15.3453 13.1149L8.47159 16.5469C3.84629 18.8563 1.95923 16.9639 4.27188 12.3531L4.97049 10.9659C5.14715 10.613 5.14715 10.0277 4.97049 9.67486L4.27188 8.2796C1.95923 3.66885 3.85432 1.77643 8.47159 4.08582Z" fill={fill} stroke={fill} strokeWidth="1.40327" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M4.047 10.3164L9.66803 10.3164" stroke={fillSecond} strokeWidth="2.40561" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}