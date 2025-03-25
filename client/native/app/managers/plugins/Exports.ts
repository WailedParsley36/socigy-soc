import PluginManager from "./V1PluginManager";

export type PluginManagerType = ActualPluginType;
export type ActualPluginType = PluginManager;

export const PluginManagerId = "plugins";

export const PluginVersions: { [version: string]: () => PluginManagerType } = {
  "v1.0.0": () => new PluginManager(),
};
