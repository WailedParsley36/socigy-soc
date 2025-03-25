import { BackgroundIconProps } from "@/components/icons/icon-base";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export default function ElipseBackground({
  fill,
  fillSecond,
  x1 = 269,
  x2 = 63.5,
  y1 = 38.5,
  y2 = 259.5,
  ...props
}: BackgroundIconProps) {
  return (
    <Svg viewBox="0 0 314 314" fill="none" {...props}>
      <Circle
        cx="157"
        cy="157"
        r="142.5"
        stroke="url(#paint0_linear_1196_192)"
        strokeWidth="29"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_1196_192"
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
