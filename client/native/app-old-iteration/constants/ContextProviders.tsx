import AppStateContextProvider from "@/contexts/AppStateContext";

export default function AppContexts({ children }: { children: any }) {
    return (
        <AppStateContextProvider>
            {children}
        </AppStateContextProvider>
    )
}