export interface SocigyElement {
  type: string;

  key?: string;
  props?: { [id: string]: any };

  children?: (UIElement | undefined)[];
  events?: { [id: string]: string[] };
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
