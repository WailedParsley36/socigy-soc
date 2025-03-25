import { createContext, useContext, useEffect, useState } from "react";

export interface TabBarVisibilityContextInfo {
    isVisible: boolean,
    hide: () => void
    show: () => void
    toggle: () => void
    set: (isVisible: boolean) => void
}

export const TabBarVisibilityContext = createContext<TabBarVisibilityContextInfo>({ isVisible: true } as TabBarVisibilityContextInfo);

export function useTabBarVisibility() {
    return useContext(TabBarVisibilityContext)
}