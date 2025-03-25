import Svg, { Path } from "react-native-svg";
import { IconProps } from "./icon-base";
import { ColorValue } from "react-native";
interface Props extends IconProps {
    fillSecond: ColorValue
}

export default function ImageIcon({ fill = "#5B5B5B", fillSecond = "#FEFEFE", strokeWidth, ...rest }: Props) {
    return <Svg viewBox="0 0 43 44" fill="none" {...rest}>
        <Path d="M15.6867 42.3625H27.8095C37.9119 42.3625 41.9528 38.3215 41.9528 28.2192V16.0964C41.9528 5.99406 37.9119 1.95312 27.8095 1.95312H15.6867C5.58439 1.95312 1.54346 5.99406 1.54346 16.0964V28.2192C1.54346 38.3215 5.58439 42.3625 15.6867 42.3625Z" fill={fillSecond} stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path fillRule="evenodd" clipRule="evenodd" d="M15.516 42.3619H27.98C37.9573 42.3164 41.9527 38.2642 41.9527 28.219V21.9C39.0592 19.2941 34.7334 19.5639 31.7074 22.794L26.742 28.1024C24.2199 30.7955 19.5172 31.029 16.2594 28.6161L15.6814 28.1802C12.2923 25.6583 7.51082 25.9697 5.06751 28.8496L1.86865 32.6515C3.00049 39.4759 7.16074 42.3238 15.516 42.3619Z" fill={fill} />
        <Path d="M15.6862 18.116C17.9179 18.116 19.7271 16.3069 19.7271 14.0751C19.7271 11.8434 17.9179 10.0342 15.6862 10.0342C13.4545 10.0342 11.6453 11.8434 11.6453 14.0751C11.6453 16.3069 13.4545 18.116 15.6862 18.116Z" fill={fill} />
    </Svg>

}