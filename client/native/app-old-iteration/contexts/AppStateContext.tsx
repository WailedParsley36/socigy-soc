import AppInfo from "@/constants/AppInfo";
import {
  AppStateManager,
  ManagerStates,
} from "@/managers/states/AppStateManager";
import { createContext, useEffect, useState } from "react";

const stateManager = new AppStateManager(AppInfo.environment.logLevel);

export const AppStateContext = createContext<ManagerStates>(
  stateManager.getStates()
);

export default function AppStateContextProvider({
  children,
}: {
  children: any;
}) {
  const [states, setStates] = useState<ManagerStates>(stateManager.getStates());

  useEffect(() => {
    async function init() {
      await stateManager.initializeAsync(setStates);
    }

    init();

    return () => {
      Object.values(stateManager.getStates().managers).forEach((x) => {
        x.manager.unload();
      });
    };
  }, []);

  return (
    <AppStateContext.Provider value={states}>
      {children}
    </AppStateContext.Provider>
  );
}
