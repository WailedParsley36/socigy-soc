import UIRegistryManager from "./UIRegistryManager";

export type UIRegistryManagerType = ActualUIRegistryType;
export type ActualUIRegistryType = UIRegistryManager;

export const UIRegistryManagerId = "ui-registry";

export const UIRegistryVersions: {
  [version: string]: () => UIRegistryManagerType;
} = {
  "v1.0.0": () => new UIRegistryManager(),
};
