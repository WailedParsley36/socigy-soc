import { ReactElement } from "react";
import { ComponentBasicEventData, InternalEventData } from "./types";
import DefaultComponents from "./DefaultComponents";

export default class UIRegistry {
  // ComponentId -> PluginId
  private components: Map<string, string> = new Map();
  // Plugin -> Component[]
  private plugins: Map<string, string[]> = new Map();

  getDefault(
    id: keyof typeof DefaultComponents,
    overrideProps?: any
  ): ReactElement<any, any> {
    return DefaultComponents[id].component(
      overrideProps ?? DefaultComponents[id].props
    );
  }

  getDefaultCallable(id: keyof typeof DefaultComponents) {
    return DefaultComponents[id].component;
  }

  getRegisteredComponents(): [keyof typeof DefaultComponents, string][] {
    return Array.from(this.components.entries()) as never;
  }
  getRegisteredComponentsForPlugin(id: string): string[] | undefined {
    return this.plugins.get(id);
  }

  componentExists(id: string) {
    return this.components.has(id);
  }

  getComponentPlugin(id: string): string | undefined {
    return this.components.get(id);
  }

  private internal_pluginUnloaded(data: InternalEventData) {
    let registered = this.plugins.get(data.pluginId);
    this.plugins.delete(data.pluginId);

    console.log("Plugin unloaded", registered);
    if (registered) {
      registered.forEach((x) => {
        this.components.delete(x);
      });
    }
  }

  private internal_registerComponent(data: ComponentBasicEventData) {
    // TODO: SEC - Check permissions before registering, when the plugin does not have permissions call method {...} - NOT_IMPLEMENTED
    // TODO: SEC - Make a method for permission error handling (when plugin does something for which it doesn't have permissions)

    console.log("REGISTERING COMPONENT", data.componentId, data.pluginId);

    this.components.set(data.componentId, data.pluginId);
    let registered = this.plugins.get(data.pluginId);
    if (!registered) this.plugins.set(data.pluginId, [data.componentId]);
    else {
      registered.push(data.componentId);
      this.plugins.set(data.pluginId, registered);
    }
  }
  private internal_removeComponent(data: ComponentBasicEventData) {
    // TODO: SEC - Check permissions before registering, when the plugin does not have permissions call method {...} - NOT_IMPLEMENTED
    // TODO: SEC - Make a method for permission error handling (when plugin does something for which it doesn't have permissions)
    console.log("REMOVING COMPONENT");

    this.components.delete(data.componentId);
    let registered = this.plugins.get(data.pluginId);
    if (registered) {
      this.plugins.set(
        data.pluginId,
        registered.filter((x) => x != data.componentId)
      );
    }
  }
}
