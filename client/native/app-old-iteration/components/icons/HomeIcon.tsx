import Svg, { Path } from "react-native-svg";
import { IconProps, TabBarIconProps } from "./icon-base";
import React from "react";

export default function HomeIcon({ fill, strokeWidth = 1.5, filled, ...rest }: TabBarIconProps) {
    return (
        <Svg viewBox="0 0 24 24" fill="none" {...rest}>
            {filled ?
                <Path d="M20.0402 6.81994L14.2802 2.78994C12.7102 1.68994 10.3002 1.74994 8.79023 2.91994L3.78023 6.82994C2.78023 7.60994 1.99023 9.20994 1.99023 10.4699V17.3699C1.99023 19.9199 4.06023 21.9999 6.61023 21.9999H17.3902C19.9402 21.9999 22.0102 19.9299 22.0102 17.3799V10.5999C22.0102 9.24994 21.1402 7.58994 20.0402 6.81994ZM12.7502 17.9999C12.7502 18.4099 12.4102 18.7499 12.0002 18.7499C11.5902 18.7499 11.2502 18.4099 11.2502 17.9999V14.9999C11.2502 14.5899 11.5902 14.2499 12.0002 14.2499C12.4102 14.2499 12.7502 14.5899 12.7502 14.9999V17.9999Z" fill={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                :
                <>
                    <Path d="M9.02 2.83992L3.63 7.03992C2.73 7.73992 2 9.22992 2 10.3599V17.7699C2 20.0899 3.89 21.9899 6.21 21.9899H17.79C20.11 21.9899 22 20.0899 22 17.7799V10.4999C22 9.28992 21.19 7.73992 20.2 7.04992L14.02 2.71992C12.62 1.73992 10.37 1.78992 9.02 2.83992Z" stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M12 17.99V14.99" stroke={fill} strokeWidth={strokeWidth} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                </>
            }
        </Svg>
    )
}
