import React, {
  act,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { View, Text, FlatList, Image } from "react-native";
import SocigyWasmModule from "socigy-wasm/SocigyWasmModule";

const componentsMap: any = {
  View: View,
  Text: Text,
  Image: Image,
  FlatList: FlatList,
  Fragment: React.Fragment,
};

interface UIElement {
  type: string;
  props?: any;
  children?: (string | UIElement)[];
  events?: [];
}

interface VDOMChange {
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

export interface DynamicComponentProps {
  rootElement?: UIElement;
  id: string;
}

const renderElement = (element?: UIElement) => {
  console.log("Before Rendering Component...");

  if (!element) {
    return undefined;
  } else if (typeof element === "string") {
    return <Text key={Math.random()}>{element}</Text>;
  }

  console.log("Rendering Component...");

  const { type, props, children } = element;

  const Component = componentsMap[type];

  return (
    <Component
      key={Math.random()}
      {...props}
      style={[props?.className && props?.styles[props.className]]} // WTF?
    >
      {children?.map((child, index) => renderElement(child as UIElement))}
    </Component>
  );
};

const vdomReducer = (
  state: UIElement | undefined,
  action: VDOMChange
): UIElement | undefined => {
  const applyChange = (
    current: UIElement,
    path: number[],
    index = 0
  ): UIElement => {
    if (index === path.length) {
      switch (action.type) {
        case "addElement":
          return {
            ...current,
            children: [...(current.children || []), action.element!],
          };
        case "removeElement":
          return {
            ...current,
            children: current.children?.filter((_, i) => i !== path[index]),
          };
        case "replaceElement":
          return action.element!;
        case "updateText":
          return { ...current, children: [action.text!] };
        case "updateProps":
          return { ...current, props: { ...current.props, ...action.props } };
        case "updateProp":
          return {
            ...current,
            props: { ...current.props, [action.key!]: action.value },
          };
        case "removeProp":
          const newProps = { ...current.props };
          delete newProps[action.key!];
          return { ...current, props: newProps };
        case "removeProps":
          return { ...current, props: {} };
        case "updateChildren":
          return { ...current, children: action.children! };
        case "updateChild":
          return {
            ...current,
            children: current.children?.map((c, i) =>
              i === path[index] ? action.child! : c
            ),
          };
        case "removeChildren":
          return { ...current, children: [] };
        case "updateStyle":
          return {
            ...current,
            props: {
              ...current.props,
              style: { ...current.props?.style, ...action.styles },
            },
          };
        case "removeAll":
          return { type: "View", children: [] };
        default:
          return current;
      }
    }

    return {
      ...current,
      children: current.children?.map((child, i) =>
        i === path[index]
          ? applyChange(child as UIElement, path, index + 1)
          : child
      ),
    };
  };

  if (!state || action.type == "removeAll") {
    return undefined;
  }
  return applyChange(state, action.path || []);
};

export default function DynamicComponent({
  id,
  rootElement,
}: DynamicComponentProps) {
  const [state, dispatch] = useReducer(vdomReducer, rootElement);

  useEffect(() => {
    // Render initial component VDOM
    // Add listener for render changes

    const subscription = SocigyWasmModule.addListener(
      "onComponentChange",
      (data) => {
        if (!data.changes) return;

        JSON.parse(data.changes).forEach((x: VDOMChange) => {
          dispatch(x);
        });
      }
    );

    return () => {
      // Remove listener for render changes
      subscription.remove();
    };
  }, [id]);

  return <>{renderElement(state)}</>;
}
