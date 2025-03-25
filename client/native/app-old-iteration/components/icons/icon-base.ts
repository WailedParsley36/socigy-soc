import { ColorValue } from "react-native";
import { Shape, SvgProps } from "react-native-svg";

export interface IconProps extends SvgProps {
  height: string;
  width: string;
  fill?: ColorValue;
}

export interface TabBarIconProps extends IconProps {
  filled: boolean
}

export interface BackgroundIconProps extends IconProps {
  fillSecond: ColorValue;

  x1?: number;
  x2?: number;

  y1?: number;
  y2?: number;
}
