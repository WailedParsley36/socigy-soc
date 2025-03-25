import TabBar from '@/components/navigation/TabBar';
import { AppState } from '@/managers/BaseManager';
import { useAuth } from '@/managers/Exports';
import { Href, router, Slot } from 'expo-router';
import React, { forwardRef, Ref, useEffect, useState } from 'react';
import { Dimensions, Platform, Pressable, Text, View } from 'react-native';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import clsx from 'clsx';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Colors, Theme } from '@/constants/Colors';
import ExpandableCircleButton from '@/components/navigation/ExpandableCircleButton';
import AudioIcon from '@/components/icons/AudioIcon';
import ImageIcon from '@/components/icons/ImageIcon';
import VideoIcon from '@/components/icons/VideoIcon';
import { TabBarVisibilityContext, TabBarVisibilityContextInfo } from '@/contexts/TabBarVisibilityContext';
import AppsIcon from '@/components/icons/AppsIcon';
import SearchIcon from '@/components/icons/SearchIcon';
import CreateIcon from '@/components/icons/CreateIcon';
import HomeIcon from '@/components/icons/HomeIcon';
import UserIcon from '@/components/icons/UserIcon';

const tabs = [
  {
    title: "Apps",
    href: "/app/apps",
    icon: (isFocused: boolean) => <AppsIcon height={isFocused ? '28' : '24'} width={isFocused ? '28' : '24'} fill={isFocused ? Colors[Theme]['text-primary'] : Colors[Theme]['text-third']} filled={isFocused} />
  },
  {
    title: "Search",
    href: "/app/search",
    icon: (isFocused: boolean) => <SearchIcon height={isFocused ? '28' : '24'} width={isFocused ? '28' : '24'} fill={isFocused ? Colors[Theme]['text-primary'] : Colors[Theme]['text-third']} filled={isFocused} />
  },
  {
    title: "Create",
    href: "/app/create",
    icon: (isFocused: boolean) => <CreateIcon height={isFocused ? '28' : '24'} width={isFocused ? '28' : '24'} fill={isFocused ? Colors[Theme]['text-primary'] : Colors[Theme]['text-third']} filled={isFocused} />
  },
  {
    title: "Home",
    href: "/app",
    icon: (isFocused: boolean) => <HomeIcon height={isFocused ? '28' : '24'} width={isFocused ? '28' : '24'} fill={isFocused ? Colors[Theme]['text-primary'] : Colors[Theme]['text-third']} filled={isFocused} />
  },
  {
    title: "Profile",
    href: "/app/profile",
    icon: (isFocused: boolean) => <UserIcon height={isFocused ? '28' : '24'} width={isFocused ? '28' : '24'} fill={isFocused ? Colors[Theme]['text-primary'] : Colors[Theme]['text-third']} filled={isFocused} />
  },
]

export default function SubLayout() {
  const auth = useAuth();
  const [isVisible, setIsVisible] = useState<TabBarVisibilityContextInfo>({ isVisible: true } as TabBarVisibilityContextInfo);

  const visibilityFunctions = {
    hide: () => {
      setIsVisible({ isVisible: false, ...visibilityFunctions })
    },
    show: () => {
      setIsVisible({ isVisible: true, ...visibilityFunctions })
    },
    toggle: () => {
      setIsVisible(prev => ({ isVisible: prev.isVisible, ...visibilityFunctions }))

    },
    set: (isVisible: boolean) => {
      setIsVisible({ isVisible: isVisible, ...visibilityFunctions })
    }
  }

  useEffect(() => {
    if (auth.state == AppState.Loading)
      return;

    if (auth.state != AppState.Authorized) {
      router.replace('/auth')
    }
  }, [auth.state])

  useEffect(() => {
    setIsVisible(prev => ({ isVisible: prev.isVisible, ...visibilityFunctions }))
  }, [])

  if (auth.state == AppState.Loading)
    return <View className='flex-1 flex justify-center items-center bg-background'><Text className='text-foreground'>Loading...</Text></View>

  return <TabBarVisibilityContext.Provider value={isVisible}>
    <Tabs>
      <TabSlot detachInactiveScreens />
      <TabList className={clsx(isVisible.isVisible ? "" : "hidden", 'absolute bottom-0 flex-1 flex-row inset-x-0 align-middle h-20 items-center rounded-t-2xl px-16 shadow-lg bg-level-2 justify-center')}>
        {tabs.map(x =>
          <TabTrigger key={x.href} asChild name={x.title.toLowerCase()} href={x.href as Href} reset='always'>
            <TabButton icon={x.icon} title={x.title} />
          </TabTrigger>
        )}
      </TabList>
    </Tabs>
  </TabBarVisibilityContext.Provider>
}

interface TabButtonProps {
  title: string
  icon?: (isFocused: boolean) => any
  isCreate?: boolean
}

const TabButton = forwardRef(
  ({ icon, title, children, isFocused, href, ...props }: TabTriggerSlotProps & TabButtonProps, ref: Ref<View>) => {
    const handlePress = () => {
      router.navigate(href as Href)
    }

    return (
      <Pressable
        ref={ref}
        {...props}
        onPress={handlePress}
        className={clsx("h-full px-4", isFocused ? "text-level-5" : "text-foreground")}
      >
        <View className='flex flex-col items-center justify-center'>
          {icon && icon(isFocused!)}
        </View>
      </Pressable >
    );
  });