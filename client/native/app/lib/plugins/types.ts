import { DragEvent } from "react";

export interface SocigyNativeEvent<T extends SocigyNativeEventData> {
  type:
    | keyof PointerEvent
    | keyof DragEvent
    | "onLayout"
    | "onTextLayout"
    | "onPress"
    | "onPressIn"
    | "onPressOut"
    | "onLongPress"
    | "onAccessibilityTap"
    | "onMagicTap"
    | "onTextChange";
  data: T;
}
export interface SocigyNativeEventData {}
export interface OnLayoutNativeEventData extends SocigyNativeEventData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SocigyEventData {}
export interface PluginSpecificEventData extends SocigyEventData {
  pluginId: string;
}
export interface ErrorEventData extends SocigyEventData {
  error?: string;
}
export interface ComponentSpecificEventData extends PluginSpecificEventData {
  componentId: string;
}

export interface LogData extends SocigyEventData {
  message: string;
  showUI?: boolean;
  uiDelay?: number;
}

export interface CallbackData extends PluginSpecificEventData {
  callbackId: string;
}

export interface RenderData
  extends PluginSpecificEventData,
    ErrorEventData,
    ComponentSpecificEventData {
  result?: string;
}

export interface RenderChangeData
  extends PluginSpecificEventData,
    ComponentSpecificEventData,
    ErrorEventData {
  changes?: string;
}

export interface ComponentBasicEventData
  extends PluginSpecificEventData,
    ComponentSpecificEventData {}

export interface InternalEventData extends PluginSpecificEventData {
  success: boolean;
}

export type SocigyWasmModuleEvents = {
  onLog(data: LogData): void;
  onError(data: LogData): void;
  onFatal(data: LogData): void;

  onPluginLoaded(data: InternalEventData): void;
  onPluginInitialized(data: InternalEventData): void;
  onPluginUnloaded(data: InternalEventData): void;

  getPermissions(data: CallbackData): void;
  getPermission(data: CallbackData): void;
  getDeclaredPermissions(data: CallbackData): void;
  requestPermissions(data: CallbackData): void;

  onComponentChange(data: RenderChangeData): void;
  onComponentRender(data: RenderData): void;
  removeComponent(data: ComponentBasicEventData): void;
  registerComponent(data: ComponentBasicEventData): void;
  onAppWindowChange(): void;
};
