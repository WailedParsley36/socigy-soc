import { registerWebModule, NativeModule } from "expo";

import { SocigyNativeEvent, SocigyWasmModuleEvents } from "./SocigyWasm.types";

// TODO: Implement WEB Wasm plugin loading

const Socigy = { loaded: {} };
const SocigyLogging = {};
import { PermissionDeclaration } from "./mock/permissions.js";

const API_VERSION = "1";

type Guid = `${string}-${string}-${string}-${string}`;

interface PluginPermission {
  description?: string;
  link?: string;
  required?: boolean;
}

interface PermissionState {
  name: string;
  granted: boolean;
  canAskAgain: boolean;
}

interface PluginComponentPermission extends PluginPermission {
  componentIds: Guid[];
}

interface PluginConfig {
  name: string;
  version: `${string}.${string}.${string}`;
  authors: string[];
  description?: string;
  permissions: { [name: string]: PluginPermission };

  ui: {};
}

function apiLog(id: string, ...rest) {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  const formattedTime = `${hours}:${minutes}:${seconds}:${ms}`;

  const restString = rest.map((x) => `${x} `);
  Socigy.loaded[id].imports.logging.log(
    `${formattedTime}   \x1b[1;35mAPI\x1b[0m: ${restString}`
  );
}

declare global {
  var SocigyPromises: {
    reject(id: string, error: string);
    resolve(id: string, data?: string);
  };

  // Id is the plugin_id
  var SocigyLogging: {
    log(id: string, message: string);
    error(id: string, message: string, showUI: boolean, uiDelay: number);
    fatal(id: string, message: string, uiDelay: number);
  };

  var SocigyPermissions: {
    getPermissions(id: string, callbackId: string): PermissionState[];
    getPermission(
      id: string,
      name: string,
      callbackId: string
    ): PermissionState;
    getDeclaredPermissions(
      id: string,
      callbackId: string
    ): PermissionDeclaration;
    requestPermissions(id: string, permissions: string, callbackId: string);
  };

  var SocigyDevice: {};

  var SocigyUI: {
    onComponentChange(pluginId: string, id: string, changes: string);
    onComponentRender(
      pluginId: string,
      id: string,
      result?: string,
      error?: string
    );
    removeComponent(pluginId: string, id: string);
    registerComponent(pluginId: string, id: string);

    onAppWindowChange(pluginId: string, id: string, changes: string);
  };

  var SocigyUtils: {
    // This can be ocluded
    randomUUID(): string;
  };

  var SocigyInternal: {
    onPluginInitialized(status: boolean, id: string, error?: string);
    onPluginLoaded(status: boolean, id: string, error?: string);
  };

  var Socigy: {
    loaded: { [id: string]: PluginInstance };
    Instance: typeof PluginInstance;
  };
}

class SocigyLoggingApi {
  private id: string;
  constructor(id) {
    this.id = id;
  }

  log(message: string) {
    SocigyLogging.log(this.id, message);
  }
  error(message: string, showUI: boolean, uiDelay: number) {
    SocigyLogging.error(this.id, message, showUI, uiDelay);
  }
  fatal(message: string, uiDelay: number) {
    SocigyLogging.fatal(this.id, message, uiDelay);
  }
}

class SocigyPermissionsApi {
  private id: string;
  private instance: PluginInstance;
  constructor(id, instance) {
    this.id = id;
    this.instance = instance;
  }

  getDeclaredPermissions(callbackId: string) {
    this.instance.callbacks[callbackId] = (permis) => {
      this.instance.api.invoke_rust_callback(callbackId, permis?.data ?? "[]");
    };
    SocigyPermissions.getDeclaredPermissions(this.id, callbackId);
  }

  getPermissionsAsync(callbackId: string) {
    this.instance.callbacks[callbackId] = (permis) => {
      this.instance.api.invoke_rust_callback(callbackId, permis?.data ?? "[]");
    };
    SocigyPermissions.getPermissions(this.id, callbackId);
  }

  requestPermissionsAsync(callbackId: string, requestedPermissions: string[]) {
    this.instance.callbacks[callbackId] = (permis) => {
      this.instance.api.invoke_rust_callback(callbackId, permis?.data ?? "[]");
    };
    SocigyPermissions.requestPermissions(
      this.id,
      JSON.stringify(requestedPermissions),
      callbackId
    );
  }
}

class SocigyDeviceApi {
  private id: string;
  constructor(id) {
    this.id = id;
  }
}

class SocigyUtilsApi {
  private id: string;
  constructor(id) {
    this.id = id;
  }

  crypto = {
    randomV4Uuid() {
      return SocigyUtils.randomUUID();
    },
  };
}

class SocigyUiApi {
  private id: string;
  private eventRegistry: { [id: string]: (e: UIEvent) => void } = {};
  events: any;
  render: any;

  constructor(id) {
    this.id = id;
    this.events = {
      invokeEvent(id: string, e: UIEvent) {
        this.eventRegistry[id](e);
        apiLog(id, "Invoked UI Event", id);
      },
      addEventListener(id: string, listener: (e: UIEvent) => void) {
        this.eventRegistry[id] = listener;
        apiLog(id, "Registered UI Event", id);
      },
      removeEventListener(id: string) {
        delete this.eventRegistry[id];
        apiLog(id, "Removed UI Event", id);
      },
    };
    this.render = {
      processComponentRenderChanges(componentId: string, changes: string) {
        apiLog(id, "Renderer sent changes for component", componentId, changes);
        SocigyUI.onComponentChange(id, componentId, changes);
      },
      processAppRenderChanges(id: string, changes: string) {},
    };
  }

  registerComponent(id: string) {
    apiLog(this.id, "UI Component registered", id);
    SocigyUI.registerComponent(this.id, id);
  }

  removeComponent(id: string) {
    apiLog(this.id, "UI Component deleted", id);
    SocigyUI.removeComponent(this.id, id);
  }

  onAppWindowRender: (
    id: string,
    instance: number,
    result: string
  ) => {
    // apiLog(`AppWindow(${id}) instance ${instance} has rendered: `, result)
  };
}

class SocigyScopedImports {
  logging: SocigyLoggingApi;
  permissions: SocigyPermissionsApi;

  device: SocigyDeviceApi;
  utils: SocigyUtilsApi;
  ui: SocigyUiApi;

  constructor(id: string, instance: PluginInstance) {
    this.logging = new SocigyLoggingApi(id);
    this.permissions = new SocigyPermissionsApi(id, instance);
    this.device = new SocigyDeviceApi(id);
    this.utils = new SocigyUtilsApi(id);
    this.ui = new SocigyUiApi(id);
  }
}

class PluginInstance {
  id: string;
  config: PluginConfig;

  callbacks: { [id: string]: any } = {};

  exports: { [id: string]: any };
  imports: SocigyScopedImports;
  api: { [id: string]: any } = {};

  constructor(id: string) {
    this.id = id;
    this.imports = new SocigyScopedImports(id, this);
  }

  invokeUiEvent(id: string, e: string) {
    this.api.invoke_ui_event(id, e);
  }
  removeEventListener(id: string) {
    this.imports.ui.events.removeEventListener(id);
  }

  private getScopedImports() {
    const imports = {
      ...this.imports,
    };
    const internal_plugin_id = this.id;

    // [IMPORT_HERE]

    this.imports = imports;
    return imports as never as WebAssembly.Imports;
  }
  async checkChecksumAsync(data: ArrayBuffer): Promise<boolean> {
    // TODO: Implement the plugin checksum endpoint
    return true;

    const response = await fetch(
      `https://api.socigy.com/${API_VERSION}/plugins/checksum?id=${this.id}`
    );
    if (response.status != 200) {
      return false;
    }
    const expectedChecksum = await response.text();

    // Computing checksum of passed data
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return hashHex == expectedChecksum;
  }

  loadFromBytes(data: ArrayBuffer) {
    this.checkChecksumAsync(data)
      .then(
        function (isValid: boolean) {
          if (!isValid) return;

          WebAssembly.compile(data)
            .then(
              function (compiled: WebAssembly.Module) {
                WebAssembly.instantiate(compiled, this.getScopedImports())
                  .then(
                    function (exprts: WebAssembly.Instance) {
                      this.exports = exprts.exports;
                      SocigyInternal.onPluginLoaded(true, this.id, null);
                    }.bind(this)
                  )
                  .catch((e) => {
                    SocigyInternal.onPluginLoaded(
                      false,
                      this.id,
                      `Failed to load plugin(${this.id}) from binaries: ` +
                        e.toString()
                    );
                  });
              }.bind(this)
            )
            .catch((e) => {
              SocigyInternal.onPluginLoaded(
                false,
                this.id,
                `Failed to load plugin(${this.id}) from binaries: ` +
                  e.toString()
              );
            });
        }.bind(this)
      )
      .catch((e) => {
        SocigyInternal.onPluginLoaded(
          false,
          this.id,
          `Failed to load plugin(${this.id}) from binaries: ` + e.toString()
        );
      });
  }
  async loadFromBytesAsync(promiseId: string, data: ArrayBuffer) {
    try {
      if (!(await this.checkChecksumAsync(data))) {
        SocigyPromises.reject(promiseId, "Passed binaries are not valid");
        return;
      }

      const compiledModule = await WebAssembly.compile(data);
      this.exports = (
        await WebAssembly.instantiate(compiledModule, this.getScopedImports())
      ).exports;
      SocigyPromises.resolve(promiseId, undefined);
    } catch (e) {
      SocigyPromises.reject(
        promiseId,
        "Unexpected error happened " + e.toString()
      );
    }
  }

  initialize() {
    try {
      this.api.initialize();
      this.api.main();

      SocigyInternal.onPluginInitialized(true, this.id, undefined);
    } catch (e) {
      SocigyInternal.onPluginInitialized(
        false,
        this.id,
        `Failed to initialize plugin(${this.id}): ` + e.toString()
      );
    }
  }
  async initializeAsync(promiseId: string) {
    try {
      this.api.initialize();
      this.api.main();

      SocigyPromises.resolve(promiseId, undefined);
    } catch (e) {
      SocigyPromises.reject(
        promiseId,
        `Failed to initialize plugin(${this.id}): ` + e.toString()
      );
    }
  }

  invokeCallbackAsync(promiseId: string, callbackId: string, data: any) {
    try {
      const callback = this.callbacks[callbackId];
      if (callback) callback(data);

      delete this.callbacks[callbackId];
      SocigyPromises.resolve(promiseId, undefined);
    } catch (e) {
      try {
        delete this.callbacks[callbackId];
      } catch (ee) {}
      SocigyPromises.reject(
        promiseId,
        `Failed to invoke callback ${callbackId}`
      );
    }
  }

  renderComponent(componentId: string, props?: string) {
    const result = this.api.render_component(componentId, props);
    SocigyUI.onComponentRender(this.id, componentId, result, undefined);
  }
}

globalThis.Socigy = { Instance: PluginInstance, loaded: {} };

class SocigyWasmModule extends NativeModule<SocigyWasmModuleEvents> {
  isSupported = false;

  async invokeJsCallbackAsync(
    pluginId: string,
    data: string,
    callbackId: string
  ): Promise<string> {
    return "";
  }

  renderComponent(
    pluginId: string,
    componentId: string,
    props?: string
  ): boolean {
    return true;
  }
  invokeUiEvent(
    id: string,
    eventId: string,
    event: SocigyNativeEvent<any> | string
  ) {}
  removeUiEventListener(id: string, eventId: string) {}

  getLoadedLanguages(): string[] {
    return [];
  }
  getLoadedPlugins(): string[] {
    return [];
  }
  getLoadedVersionsForLanguage(language: string): string[] | null {
    return [];
  }
  getLoadedPluginsForLanguageVersion(
    language: string,
    version: string
  ): string[] | null {
    return [];
  }

  async unloadPluginAsync(id: string): Promise<void> {
    return;
  }
  async loadPluginAsync(id: string): Promise<void> {
    return;
  }
  async initializePluginAsync(id: string): Promise<void> {
    return;
  }
}

export default registerWebModule(SocigyWasmModule);
