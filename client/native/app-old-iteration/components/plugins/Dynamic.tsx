import { SocigyElement, UIElement, VDOMChange } from "./Types";
import {
  View,
  Text,
  FlatList,
  Touchable,
  PointerEvents,
  GestureResponderHandlers,
} from "react-native";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { produce } from "immer";
import SocigyWasm from "socigy-wasm";
import Image from "expo-image";
import UIRegistry from "@/managers/ui-registry/UIRegistryManager";
import { Guid } from "expo-passkeys/build/ExpoPasskeys.types";
import { useUiComponent, useUiRegistry } from "@/managers/Exports";
import DefaultComponents from "../../constants/Components";

function External({ uiRegistry, id, ...rest }: any) {
  return useUiComponent(
    uiRegistry,
    "8d11e7ab-92d2-4157-bcba-b368921146e5",
    rest
  );
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
          if (!parent && !draft) return action.element; // ROOT ELEMENT
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

const eventNamesArray: string[] = [
  "onPointerEnter",
  "onPointerEnterCapture",
  "onPointerLeave",
  "onPointerLeaveCapture",
  "onPointerMove",
  "onPointerMoveCapture",
  "onPointerCancel",
  "onPointerCancelCapture",
  "onPointerDown",
  "onPointerDownCapture",
  "onPointerUp",
  "onPointerUpCapture",

  "onTouchStart",
  "onTouchMove",
  "onTouchEnd",
  "onTouchCancel",
  "onTouchEndCapture",

  "onResponderTerminate",
  "onResponderTerminationRequest",
  "onResponderStart",
  "onResponderRelease",
  "onResponderReject",
  "onResponderGrant",
  "onResponderEnd",
  "onMoveShouldSetResponder",
  "onMoveShouldSetResponderCapture",
  "onStartShouldSetResponderCapture",
  "onStartShouldSetResponder",

  "onLayout",
  "onTextLayout",

  "onPress",
  "onPressIn",
  "onPressOut",
  "onLongPress",

  "onAccessibilityTap",
  "onMagicTap",
  "onTextChange",
];

function renderVDOM(
  element: UIElement | undefined,
  uiRegistry: UIRegistry,
  pluginId: string
): React.JSX.Element | undefined {
  if (!element) return undefined;
  else if (typeof element === "string") return <Text>{element}</Text>;

  const { type, events, children, key } = element;
  let props = { ...element.props };

  const Component = getElementByType(type);
  const renderedChildren = children?.map((x) =>
    renderVDOM(x, uiRegistry, pluginId)
  );

  if (type == "Fragment") {
    return <Component children={renderedChildren} />;
  }

  if (events) {
    Object.keys(events).forEach((event) => {
      if (eventNamesArray.includes(event)) {
        const eventIds = events[event];

        const callback = (e: any) => {
          // TODO: Remove this when the event is properly implemented
          if (event == "onLayout") {
            e.nativeEvent = { layout: { x: 0, y: 0, width: 0, height: 0 } };
          }

          const eventData = JSON.stringify({
            type: event,
            ...e.nativeEvent,
          });
          eventIds.forEach((eventId) => {
            uiRegistry.invokeUiEvent(pluginId, eventId, eventData);
          });
        };

        if (props) {
          props[event] = callback;
        } else {
          props = { [event]: callback };
        }
      }
    });
  }

  if (type == "External") {
    return (
      <Component
        key={element.key}
        {...props}
        children={renderedChildren}
        uiRegistry={uiRegistry}
      />
    );
  }

  return (
    // TODO: Replace Math.random() with a proper key
    <Component key={Math.random()} {...props} children={renderedChildren} />
  );
}

export interface DynamicProps {
  id: keyof typeof DefaultComponents;
  defaultElement: (props: any) => React.JSX.Element | undefined;
  props?: object;

  children?: any;

  uiRegistry: UIRegistry;
}

// TODO: OPTIMIZE: Remove uneccessary logging...
// TODO: Handle passing children down to the Plugin
// TODO: Implement event invoking from plugin to React Side ?? when React passes events to its rendered child component, the child needs the ability to react
export default function Dynamic({
  id,
  defaultElement: DefaultElement,
  props,
  children,
  uiRegistry,
}: DynamicProps) {
  const [vdom, dispatchChange] = useReducer(dynamicVdomReducer, undefined);
  const [pluginId, setPluginId] = useState(uiRegistry.getComponentPlugin(id));

  useEffect(() => {
    if (!vdom) return;

    const registeredPlugin = uiRegistry.getComponentPlugin(id);
    setPluginId(registeredPlugin);
    if (!registeredPlugin) {
      return;
    }

    if (children) {
      if (props) (props as any).children = children;
      else props = { children: children };
    }

    if (
      !SocigyWasm.renderComponent(registeredPlugin, id, JSON.stringify(props))
    ) {
      console.error(`Failed to render dynamic component ${id}`);
    }
  }, [props, children]);

  useEffect(() => {
    const registeredPlugin = uiRegistry.getComponentPlugin(id);
    setPluginId(registeredPlugin);
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

    if (children) {
      if (props) (props as any).children = children;
      else props = { children: children };
    }

    if (
      !SocigyWasm.renderComponent(
        registeredPlugin,
        id,
        props ? JSON.stringify(props) : undefined
      )
    ) {
      console.error(`Failed to render dynamic component ${id}`);
    }
    return () => {
      changeSubscription.remove();
      renderSubscription.remove();
    };
  }, [id]);

  if (!vdom || !pluginId) {
    return <DefaultElement {...props} children={children} />;
  }
  return renderVDOM(vdom, uiRegistry, pluginId);
}
