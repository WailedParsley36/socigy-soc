import { AppState, InitializationManagerInfo } from "@/managers/BaseManager";
import { AuthManagerId, AuthVersions } from "@/managers/auth/Exports";
import AuthManager from "@/managers/auth/V1AuthManager";
import AppInfo from "./AppInfo";
import { ContentManagerId, ContentVersions } from "@/managers/content/Exports";
import { UserManagerId, UserVersions } from "@/managers/user/Exports";
import {
  NotificationManagerId,
  NotificationVersions,
} from "@/managers/notifications/Exports";
import {
  UIRegistryManagerId,
  UIRegistryVersions,
} from "@/managers/ui-registry/Exports";
import { PluginManagerId, PluginVersions } from "@/managers/plugins/Exports";

export const Managers: InitializationManagerInfo[] = [
  {
    id: PluginManagerId,
    state: AppState.Created,
    manager: PluginVersions[AppInfo.appVersion](),
    waitForInitialization: false,
  },
  {
    id: UIRegistryManagerId,
    state: AppState.Created,
    manager: UIRegistryVersions[AppInfo.appVersion](),
    waitForInitialization: false,
  },
  {
    id: NotificationManagerId,
    state: AppState.Loading,
    manager: NotificationVersions[AppInfo.appVersion](),
    waitForInitialization: false,
  },
  {
    id: AuthManagerId,
    state: AppState.Loading,
    manager: AuthVersions[AppInfo.appVersion](),
    waitForInitialization: true,
  },
  {
    id: ContentManagerId,
    state: AppState.Created,
    manager: ContentVersions[AppInfo.appVersion](),
    waitForInitialization: false,
  },
  {
    id: UserManagerId,
    state: AppState.Created,
    manager: UserVersions[AppInfo.appVersion](),
    waitForInitialization: false,
  },
];
