import { BottomTabBarProps, BottomTabNavigationEventMap, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import React from 'react'
import { Text, View, Platform } from 'react-native';
import { NavigationHelpers, NavigationRoute, ParamListBase, useLinkBuilder, useRoute, useTheme } from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import clsx from 'clsx';
import { Colors, Theme } from '@/constants/Colors';
import CreateButton from './TabsCreateButton';

export default function TabBar({ state, navigation, descriptors }: BottomTabBarProps) {
    const currentRoute = useRoute();

    return (
        <View className={clsx(!currentRoute.name.includes('/') ? 'flex' : 'hidden')}>
            <View className='absolute bottom-6 flex-row inset-x-6 align-middle items-center rounded-full px-10 shadow-lg bg-black justify-between'>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        console.log("Long press")
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    if (route.name == "create") {
                        return <CreateButton key={index} index={index} isFocused={isFocused} onPress={onPress} onLongPress={onLongPress} options={options} route={route} navigation={navigation} />
                    }
                    else
                        return <TabLink key={index} index={index} isFocused={isFocused} onPress={onPress} onLongPress={onLongPress} options={options} route={route} />
                })}
            </View>
        </View>
    )
}

export interface TabInnerProps {
    index: number,
    isFocused: boolean
    options: BottomTabNavigationOptions
    route: NavigationRoute<ParamListBase, string>
    navigation?: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>;
    onPress: () => void,
    onLongPress: () => void
}


function TabLink({ index, route, isFocused, options, onPress, onLongPress }: TabInnerProps) {
    const { buildHref } = useLinkBuilder();

    return (
        <PlatformPressable
            key={index}
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            className='flex-1 py-3'
        >
            {options.tabBarIcon && options.tabBarIcon({ focused: isFocused, color: isFocused ? Colors[Theme]['text-primary'] : Colors[Theme]['text-third'], size: 45 })}
            <Text className={clsx("text-center", isFocused ? "text-text-primary" : "text-text-third")}>
                {options.title}
            </Text>
        </PlatformPressable>
    );
}