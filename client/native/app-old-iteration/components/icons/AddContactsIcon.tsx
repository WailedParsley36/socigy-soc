import Svg, { Path } from "react-native-svg";
import { IconProps } from "./icon-base";

export default function AddContactsIcon({ fill, ...rest }: IconProps) {
    return (
        <Svg viewBox="0 0 91 90" fill="none" {...rest}>
            <Path d="M43.475 51.4874C49.2947 51.4874 54.0125 46.7696 54.0125 40.9499C54.0125 35.1302 49.2947 30.4124 43.475 30.4124C37.6553 30.4124 32.9375 35.1302 32.9375 40.9499C32.9375 46.7696 37.6553 51.4874 43.475 51.4874Z" stroke={fill} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M62.9375 75.75C62.9375 67.0125 54.2375 59.8874 43.475 59.8874C32.7125 59.8874 24.0125 66.975 24.0125 75.75" stroke={fill} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M79.25 46.875C79.25 66.5625 63.3125 82.5 43.625 82.5C23.9375 82.5 8 66.5625 8 46.875C8 27.1875 23.9375 11.25 43.625 11.25C48.5375 11.25 53.225 12.225 57.5 14.025C57.0125 15.525 56.75 17.1 56.75 18.75C56.75 21.5625 57.5375 24.225 58.925 26.475C59.675 27.75 60.65 28.9124 61.775 29.8874C64.4 32.2874 67.8875 33.75 71.75 33.75C73.4 33.75 74.975 33.4874 76.4375 32.9624C78.2375 37.2374 79.25 41.9625 79.25 46.875Z" stroke={fill} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M86.75 18.75C86.75 19.95 86.6 21.1125 86.3 22.2375C85.9625 23.7375 85.3625 25.2 84.575 26.475C82.775 29.5125 79.8875 31.8749 76.4375 32.9624C74.975 33.4874 73.4 33.75 71.75 33.75C67.8875 33.75 64.4 32.2874 61.775 29.8874C60.65 28.9124 59.675 27.75 58.925 26.475C57.5375 24.225 56.75 21.5625 56.75 18.75C56.75 17.1 57.0125 15.525 57.5 14.025C58.2125 11.85 59.4125 9.90008 60.9875 8.28758C63.725 5.47508 67.55 3.75 71.75 3.75C76.175 3.75 80.1875 5.66256 82.8875 8.73756C85.2875 11.4001 86.75 14.925 86.75 18.75Z" stroke={fill} strokeWidth="4" strokeMiterlimit="10" strokeLinecap="round" stroke-linejoin="round" />
            <Path d="M77.3375 18.6749H66.1625" stroke={fill} strokeWidth="4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M71.75 13.2001V24.4125" stroke={fill} strokeWidth="4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}