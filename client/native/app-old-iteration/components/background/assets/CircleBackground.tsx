import { BackgroundIconProps, IconProps } from "@/components/icons/icon-base";
import { ColorValue } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export default function CircleBackground({
  fill,
  fillSecond,
  x1 = 91,
  x2 = 214.5,
  y1 = 82.5,
  y2 = 224.5,
  ...props
}: BackgroundIconProps) {
  return (
    <Svg viewBox="0 0 248 248" fill="none" {...props}>
      <Circle cx="124" cy="124" r="124" fill="url(#paint0_linear_1192_187)" />
      <Defs>
        <LinearGradient
          id="paint0_linear_1192_187"
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={fill} />
          <Stop offset="1" stopColor={fillSecond} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
