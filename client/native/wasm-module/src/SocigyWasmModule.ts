import { NativeModule, requireNativeModule } from "expo";

import { SocigyNativeEvent, SocigyWasmModuleEvents } from "./SocigyWasm.types";

declare class SocigyWasmModule extends NativeModule<SocigyWasmModuleEvents> {
  isSupported: boolean;

  invokeJsCallbackAsync(
    pluginId: string,
    data: string,
    callbackId: string
  ): Promise<string>;

  renderComponent(
    pluginId: string,
    componentId: string,
    props?: string
  ): boolean;
  invokeUiEvent(
    id: string,
    eventId: string,
    event: SocigyNativeEvent<any> | string
  );
  removeUiEventListener(id: string, eventId: string);

  getLoadedLanguages(): string[];
  getLoadedPlugins(): string[];
  getLoadedVersionsForLanguage(language: string): string[] | null;
  getLoadedPluginsForLanguageVersion(
    language: string,
    version: string
  ): string[] | null;

  unloadPluginAsync(id: string): Promise<void>;
  loadPluginAsync(id: string): Promise<void>;
  initializePluginAsync(id: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<SocigyWasmModule>("SocigyWasm");
