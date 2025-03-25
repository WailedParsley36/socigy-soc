import { AppStateContext } from "@/contexts/AppStateContext";
import { useContext } from "react";
import { BaseManager, AppState } from "./BaseManager";
import { ActualAuthType, AuthManagerId } from "./auth/Exports";
import { ActualContentType, ContentManagerId } from "./content/Exports";
import { ActualUserType, UserManagerId } from "./user/Exports";
import { ActualPluginType, PluginManagerId } from "./plugins/Exports";
import Dynamic from "@/components/plugins/Dynamic";
import {
  ActualUIRegistryType,
  UIRegistryManagerId,
} from "./ui-registry/Exports";
import UIRegistry from "./ui-registry/UIRegistryManager";
import DefaultComponents from "@/constants/Components";

export function useAppStateContext() {
  return useContext(AppStateContext);
}
export function useAppStateManagerContext<T extends BaseManager>(
  id: string
): { state: AppState; manager: T } {
  return useAppStateContext().managers[id] as { state: AppState; manager: T };
}

export function useAppState(): {
  state: AppState;
  refreshAppState: () => AppState;
} {
  const context = useAppStateContext();
  return { state: context.state, refreshAppState: context.refreshAppState };
}

export function useAuth() {
  return useAppStateManagerContext<ActualAuthType>(AuthManagerId);
}
export function useAuthManager() {
  return useAuth().manager;
}

export function useContent() {
  return useAppStateManagerContext<ActualContentType>(ContentManagerId);
}
export function useContentManager() {
  return useContent().manager;
}

export function useUser() {
  return useAppStateManagerContext<ActualUserType>(UserManagerId);
}
export function useUserManager() {
  return useUser().manager;
}

export function usePlugins() {
  return useAppStateManagerContext<ActualPluginType>(PluginManagerId);
}
export function usePluginManager() {
  return usePlugins().manager;
}

export function useUiComponent(
  uiRegistry: UIRegistry,
  id: keyof typeof DefaultComponents,
  props: object,
  defaultElement?: (props: any) => React.JSX.Element | undefined
) {
  if (!defaultElement) {
    defaultElement = uiRegistry.getDefaultCallable(id);
  }

  return (
    <Dynamic
      id={id}
      props={props}
      children={(props as any)?.children}
      defaultElement={defaultElement}
      uiRegistry={uiRegistry}
    />
  );
}
export function useUiRegistry() {
  return useAppStateManagerContext<ActualUIRegistryType>(UIRegistryManagerId)
    .manager;
}
