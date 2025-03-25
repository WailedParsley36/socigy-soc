import Svg, { G, Mask, Path } from "react-native-svg";
import { IconProps } from "./icon-base";

export default function GoogleLogoIcon({ fill, ...rest }: IconProps) {
    return (
        <Svg viewBox="0 0 14 14" fill="none" stroke='none' {...rest}>
            <Path d="M13.72 7.15908C13.72 6.66271 13.6755 6.18545 13.5927 5.72723H7V8.43497H10.7673C10.605 9.30997 10.1119 10.0513 9.37048 10.5477V12.3041H11.6327C12.9564 11.0855 13.72 9.29086 13.72 7.15908Z" fill="#4285F4" />
            <Path d="M6.99999 14C8.88999 14 10.4745 13.3732 11.6327 12.3041L9.3704 10.5478C8.74362 10.9678 7.94177 11.2159 6.99999 11.2159C5.17677 11.2159 3.63362 9.98454 3.08314 8.33002H0.744507V10.1436C1.89636 12.4314 4.26362 14 6.99999 14Z" fill="#34A853" />
            <Path d="M3.08315 8.33001C2.94315 7.91001 2.86363 7.46138 2.86363 7.00001C2.86363 6.53864 2.94315 6.09001 3.08315 5.67001V3.85638H0.74452C0.27048 4.80138 0 5.87049 0 7.00001C0 8.12953 0.27048 9.19864 0.74452 10.1436L3.08315 8.33001Z" fill="#FBBC04" />
            <Path d="M6.99999 2.78411C8.02766 2.78411 8.9504 3.13726 9.67588 3.83089L11.6836 1.82315C10.4714 0.69363 8.88677 0 6.99999 0C4.26362 0 1.89636 1.56863 0.744507 3.85637L3.08314 5.67C3.63362 4.01548 5.17677 2.78411 6.99999 2.78411Z" fill="#E94235" />
        </Svg>
    )
}