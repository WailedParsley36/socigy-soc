import Svg, { Path } from "react-native-svg";
import { IconProps, TabBarIconProps } from "./icon-base";

export default function AddContactsIcon({ fill, strokeWidth = 1.5, filled, ...rest }: TabBarIconProps) {
    return (
        <Svg viewBox="0 0 24 24" fill="none" {...rest}>
            <Path d="M17 10H19C21 10 22 9 22 7V5C22 3 21 2 19 2H17C15 2 14 3 14 5V7C14 9 15 10 17 10Z" fill={filled ? fill : undefined} stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5 22H7C9 22 10 21 10 19V17C10 15 9 14 7 14H5C3 14 2 15 2 17V19C2 21 3 22 5 22Z" fill={filled ? fill : undefined} stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 10C8.20914 10 10 8.20914 10 6C10 3.79086 8.20914 2 6 2C3.79086 2 2 3.79086 2 6C2 8.20914 3.79086 10 6 10Z" fill={filled ? fill : undefined} stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M18 22C20.2091 22 22 20.2091 22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22Z" fill={filled ? fill : undefined} stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}