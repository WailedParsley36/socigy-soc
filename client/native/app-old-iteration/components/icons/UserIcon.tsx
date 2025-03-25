import Svg, { Path } from "react-native-svg";
import { IconProps, TabBarIconProps } from "./icon-base";

export default function UserIcon({ fill, strokeWidth = 1.5, filled, ...rest }: TabBarIconProps) {
    return (
        <Svg viewBox="0 0 24 24" fill="none" {...rest}>
            <Path d="M12 12.5C14.7614 12.5 17 10.2614 17 7.5C17 4.73858 14.7614 2.5 12 2.5C9.23858 2.5 7 4.73858 7 7.5C7 10.2614 9.23858 12.5 12 12.5Z" fill={filled ? fill : undefined} stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={filled ? "M3.41016 22.5C3.41016 18.722 7.17176 15.5 12.0002 15.5C16.8286 15.5 20.5902 18.722 20.5902 22.5H3.41016Z" : "M20.5901 22.5C20.5901 18.63 16.7402 15.5 12.0002 15.5C7.26015 15.5 3.41016 18.63 3.41016 22.5"} fill={filled ? fill : undefined} stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}