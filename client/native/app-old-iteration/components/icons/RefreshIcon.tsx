import React from 'react'
import { IconProps } from './icon-base'
import Svg, { Path } from 'react-native-svg'

function RefreshIcon({ className, fill, strokeWidth = 1.875, ...rest }: IconProps) {
    return (
        <Svg viewBox="0 0 30 30" fill="none" {...rest}>
            <Path d="M11.3875 6.35C12.475 6.025 13.675 5.8125 15 5.8125C20.9875 5.8125 25.8375 10.6625 25.8375 16.65C25.8375 22.6375 20.9875 27.4875 15 27.4875C9.01248 27.4875 4.16248 22.6375 4.16248 16.65C4.16248 14.425 4.83748 12.35 5.98748 10.625" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M9.83752 6.65L13.45 2.5" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M9.83752 6.64996L14.05 9.72496" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    )
}

export default RefreshIcon