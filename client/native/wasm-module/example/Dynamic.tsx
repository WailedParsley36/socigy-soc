import React, { useEffect, useReducer, useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { ComponentBasicEventData, InternalEventData } from "socigy-wasm";
import SocigyWasm from "socigy-wasm";
import { produce } from "immer";
import External from "./External";

export function useRegistry(
  uiRegistry: UIRegistry,
  id: string,
  props: object,
  defaultElement: React.JSX.Element
) {
  return (
    <Dynamic
      id={id}
      props={props}
      defaultElement={defaultElement}
      uiRegistry={uiRegistry}
    />
  );
}

export class UIRegistry {
  private components: Map<string, string> = new Map();
  private plugins: Map<string, string[]> = new Map();

  constructor() {
    SocigyWasm.addListener(
      "registerComponent",
      this.internal_registerComponent.bind(this)
    );
    SocigyWasm.addListener(
      "removeComponent",
      this.internal_removeComponent.bind(this)
    );
    SocigyWasm.addListener(
      "onPluginUnloaded",
      this.internal_pluginUnloaded.bind(this)
    );
  }

  unload() {
    SocigyWasm.removeListener(
      "registerComponent",
      this.internal_registerComponent
    );
    SocigyWasm.removeListener("removeComponent", this.internal_removeComponent);
  }

  getRegisteredComponents(): [string, string][] {
    return Array.from(this.components.entries());
  }

  componentExists(id: string) {
    return this.components.has(id);
  }

  getComponentPlugin(id: string): string | undefined {
    return this.components.get(id);
  }

  registerComponent(id: string, element: React.JSX.Element) {}

  private internal_pluginUnloaded(data: InternalEventData) {
    console.log("Plugin unloaded");

    let registered = this.plugins.get(data.pluginId);
    if (registered) {
      registered.forEach((x) => {
        this.components.delete(x);
      });
    }
  }

  private internal_registerComponent(data: ComponentBasicEventData) {
    // TODO: SEC - Check permissions before registering, when the plugin does not have permissions call method {...} - NOT_IMPLEMENTED
    // TODO: SEC - Make a method for permission error handling (when plugin does something for which it doesn't have permissions)

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

export interface SocigyEvent {
  callbackIds: string[];
}

export interface SocigyElement {
  type: string;

  key?: string;
  props?: object;

  children?: (UIElement | undefined)[];
  events?: { [id: string]: SocigyEvent };
}

export type UIElement = SocigyElement | string;

export interface VDOMChange {
  type:
    | "addElement"
    | "removeAll"
    | "removeElement"
    | "replaceElement"
    | "updateText"
    | "updateProps"
    | "updateProp"
    | "removeProp"
    | "removeProps"
    | "removeChildren"
    | "updateChildren"
    | "updateChild"
    | "updateStyle";
  path?: number[];
  element?: UIElement;
  text?: string;
  props?: any;
  key?: string;
  value?: any;
  children?: (string | UIElement)[];
  child?: string | UIElement;
  styles?: Record<string, any>;
}

const NativeComponents: { [id: string]: any } = {
  View: View,
  Text: Text,
  FlatList: FlatList,
  Image: Image,
  Fragment: React.Fragment,
};

function getElementParent(
  root: SocigyElement,
  path: number[],
  index: number = 1
): UIElement {
  if (index >= path.length) return root;
  if (!root.children)
    throw new Error(
      "Invalid path was provided in change. No children left to go through"
    );

  try {
    let foundChild = root.children[path[index]];
    index++;
    if (index >= path.length) return root;
    if (!foundChild) {
      throw new Error(
        "Invalid path was provided in change. No children left to go through"
      );
    } else if (typeof foundChild === "string")
      throw new Error(
        "Invalid path was provided in change. String cannot have children"
      );
    else if (!foundChild.children)
      throw new Error(
        "Invalid path was provided in change. No children left to go through"
      );

    return getElementParent(foundChild, path, index);
  } catch (e) {
    throw e;
  }
}

function dynamicVdomReducer(
  state: UIElement | undefined,
  actions: VDOMChange[]
): UIElement | undefined {
  return produce(state, (draft) => {
    if (typeof draft === "string") return;
    else if (!draft) return actions[0].element;

    actions.forEach((action) => {
      switch (action.type) {
        case "addElement": {
          const parent = getElementParent(draft, action.path!);
          if (!parent && !draft)
            return action.element; // ROOT ELEMENT
          else if (typeof parent === "string") break;
          else if (!parent.children) parent.children = [action.element];
          else parent.children.push(action.element);

          break;
        }
        case "replaceElement": {
          const parent = getElementParent(draft, action.path!);
          if (!parent) throw new Error("Cannot update children on undefined");
          else if (typeof parent === "string")
            throw new Error("Cannot update children on string");
          else if (!parent.children) parent.children = [action.element];
          else
            parent.children[action.path![action.path!.length - 1]] =
              action.element;

          break;
        }
        case "removeElement": {
          const parent = getElementParent(draft, action.path!);
          if (!parent)
            throw new Error("Cannot remove element when parent is undefined");
          else if (typeof parent === "string")
            throw new Error("Cannot remove element when parent is string");
          else if (parent.children)
            parent.children[action.path![action.path!.length - 1]] = undefined;

          break;
        }

        // TODO: Make the PROP and STYLE updates

        case "removeAll": {
          return undefined;
        }

        case "updateChildren": {
          const parent = getElementParent(draft, action.path!);
          if (!parent) throw new Error("Cannot update children on undefined");
          else if (typeof parent === "string")
            throw new Error("Cannot update children on string");
          else if (!parent.children) parent.children = action.children;
          else parent.children = action.children;

          break;
        }
        case "removeChildren": {
          const parent = getElementParent(draft, action.path!);
          if (!parent) break;
          else if (typeof parent === "string") break;
          else if (!parent.children) parent.children = undefined;
          else parent.children = undefined;

          break;
        }
        case "updateChild": {
          const parent = getElementParent(draft, action.path!);
          if (!parent) throw new Error("Cannot update child on undefined");
          else if (typeof parent === "string")
            throw new Error("Cannot update child on string");
          else if (!parent.children) parent.children = [action.child];
          else
            parent.children[action.path![action.path!.length - 1]] =
              action.child;

          break;
        }
      }
    });

    return draft;
  });
}

function getElementByType(type: string): any {
  switch (type) {
    case "External":
      return External;
    default: {
      const found = NativeComponents[type];
      if (!found) throw new Error(`Unknown element type ${type} found`);
      return found;
    }
  }
}

function renderVDOM(element?: UIElement): React.JSX.Element | undefined {
  if (!element) return undefined;
  else if (typeof element === "string") return <Text>{element}</Text>;

  const { type, props, children, key } = element;
  const Component = getElementByType(type);
  const renderedChildren = children?.map((x) => renderVDOM(x));

  if (type == "Fragment") {
    return <Component children={renderedChildren} />;
  }

  return (
    <Component key={element.key} props={props} children={renderedChildren} />
  );
}

  export interface DynamicProps {
    id: string;
    defaultElement: React.JSX.Element;
    props?: object;

    uiRegistry: UIRegistry;
  }

  export default function Dynamic({
    id,
    defaultElement,
    props,
    uiRegistry,
  }: DynamicProps) {
    const [vdom, dispatchChange] = useReducer(dynamicVdomReducer, undefined);

    useEffect(() => {
      if (!vdom) return;

      const registeredPlugin = uiRegistry.getComponentPlugin(id);
      if (!registeredPlugin) {
        return;
      }

      if (
        !SocigyWasm.renderComponent(registeredPlugin, id, JSON.stringify(props))
      ) {
        console.error(`Failed to render dynamic component ${id}`);
      }
    }, [props]);

    useEffect(() => {
      const registeredPlugin = uiRegistry.getComponentPlugin(id);
      if (!registeredPlugin) {
        return;
      }

      const changeSubscription = SocigyWasm.addListener(
        "onComponentChange",
        (data) => {
          // console.log("CHANGES", data);
          if (!data.changes) return;

          const changes: VDOMChange[] = JSON.parse(data.changes);
          dispatchChange(changes);
        }
      );
      const renderSubscription = SocigyWasm.addListener(
        "onComponentRender",
        (data) => {
          // console.log("RENDERED", data);
          if (!data.result || data.result == "undefined") {
            return;
          }

          // console.log("CHANGING?!", data);
          dispatchChange([
            {
              type: "replaceElement",
              path: [0],
              element: data.result ? JSON.parse(data.result) : null,
            },
          ]);
        }
      );

      // TODO: Implement events from React Side
      if (
        !SocigyWasm.renderComponent(registeredPlugin, id, JSON.stringify(props))
      ) {
        console.error(`Failed to render dynamic component ${id}`);
      }
      return () => {
        changeSubscription.remove();
        renderSubscription.remove();
      };
    }, [id]);

    if (!vdom) {
      return defaultElement;
    }
    return renderVDOM(vdom);
  }
