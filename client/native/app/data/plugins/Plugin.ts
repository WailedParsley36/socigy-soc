import { ShallowUserInfo } from "@/managers/user/Exports";
import { Version } from "../General";

export type PluginLanguage = "rust";

export interface PluginPermission {
  description: string;
  link?: string;
  required: boolean;

  componentIds: string[];
}

export type SocigyPlatform = "watch" | "mobile" | "web" | "desktop" | "tv";
export type SystemType = "android" | "windows" | "linux" | "ios" | "macos";

export interface Plugin {
  id: string;
  name: string;
  authors: ShallowUserInfo[];

  version: Version;
  apiVersion: Version;

  systems: SystemType[];
  platforms: SocigyPlatform[];

  description: string;
  language: PluginLanguage;

  permissions: { [name: string]: PluginPermission };
}
