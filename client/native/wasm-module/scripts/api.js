const API_VERSION = "1";
function apiLog(id, ...rest) {
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
class SocigyLoggingApi {
  constructor(id) {
    this.id = id;
  }
  log(message) {
    SocigyLogging.log(this.id, message);
  }
  error(message, showUI, uiDelay) {
    SocigyLogging.error(this.id, message, showUI, uiDelay);
  }
  fatal(message, uiDelay) {
    SocigyLogging.fatal(this.id, message, uiDelay);
  }
}
class SocigyPermissionsApi {
  constructor(id, instance) {
    this.id = id;
    this.instance = instance;
  }
  getDeclaredPermissions(callbackId) {
    this.instance.callbacks[callbackId] = (permis) => {
      var _a;
      this.instance.api.invoke_rust_callback(
        callbackId,
        (_a = permis === null || permis === void 0 ? void 0 : permis.data) !==
          null && _a !== void 0
          ? _a
          : "[]"
      );
    };
    SocigyPermissions.getDeclaredPermissions(this.id, callbackId);
  }
  getPermissionsAsync(callbackId) {
    this.instance.callbacks[callbackId] = (permis) => {
      var _a;
      this.instance.api.invoke_rust_callback(
        callbackId,
        (_a = permis === null || permis === void 0 ? void 0 : permis.data) !==
          null && _a !== void 0
          ? _a
          : "[]"
      );
    };
    SocigyPermissions.getPermissions(this.id, callbackId);
  }
  requestPermissionsAsync(callbackId, requestedPermissions) {
    this.instance.callbacks[callbackId] = (permis) => {
      var _a;
      this.instance.api.invoke_rust_callback(
        callbackId,
        (_a = permis === null || permis === void 0 ? void 0 : permis.data) !==
          null && _a !== void 0
          ? _a
          : "[]"
      );
    };
    SocigyPermissions.requestPermissions(
      this.id,
      JSON.stringify(requestedPermissions),
      callbackId
    );
  }
}
class SocigyDeviceApi {
  constructor(id) {
    this.id = id;
  }
}
class SocigyUtilsApi {
  constructor(id) {
    this.crypto = {
      randomV4Uuid() {
        return SocigyUtils.randomUUID();
      },
    };
    this.id = id;
  }
}
class SocigyUiApi {
  constructor(id) {
    this.eventRegistry = {};
    this.id = id;
    this.events = {
      invokeEvent(id, e) {
        this.eventRegistry[id](e);
        apiLog(id, "Invoked UI Event", id);
      },
      addEventListener(id, listener) {
        this.eventRegistry[id] = listener;
        apiLog(id, "Registered UI Event", id);
      },
      removeEventListener(id) {
        delete this.eventRegistry[id];
        apiLog(id, "Removed UI Event", id);
      },
    };
    this.render = {
      processComponentRenderChanges(componentId, changes) {
        apiLog(id, "Renderer sent changes for component", componentId, changes);
        SocigyUI.onComponentChange(id, componentId, changes);
      },
      processAppRenderChanges(id, changes) {},
    };
  }
  registerComponent(id) {
    apiLog(this.id, "UI Component registered", id);
    SocigyUI.registerComponent(this.id, id);
  }
  removeComponent(id) {
    apiLog(this.id, "UI Component deleted", id);
    SocigyUI.removeComponent(this.id, id);
  }
}
class SocigyScopedImports {
  constructor(id, instance) {
    this.logging = new SocigyLoggingApi(id);
    this.permissions = new SocigyPermissionsApi(id, instance);
    this.device = new SocigyDeviceApi(id);
    this.utils = new SocigyUtilsApi(id);
    this.ui = new SocigyUiApi(id);
  }
}
class PluginInstance {
  constructor(id) {
    this.callbacks = {};
    this.api = {};
    this.id = id;
    this.imports = new SocigyScopedImports(id, this);
  }
  invokeUiEvent(id, e) {
    this.api.invoke_ui_event(id, e);
  }
  removeEventListener(id) {
    this.imports.ui.events.removeEventListener(id);
  }
  getScopedImports() {
    const imports = Object.assign({}, this.imports);
    const internal_plugin_id = this.id;
    // [IMPORT_HERE]
    this.imports = imports;
    return imports;
  }
  async checkChecksumAsync(data) {
    // TODO: Implement passing down the plugin version
    return true;
    const response = await fetch(
      `https://api.socigy.com/${API_VERSION}/plugins/checksum?id=${this.id}&version=1.0.0`
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
  loadFromBytes(data) {
    this.checkChecksumAsync(data)
      .then(
        function (isValid) {
          if (!isValid) return;
          WebAssembly.compile(data)
            .then(
              function (compiled) {
                WebAssembly.instantiate(compiled, this.getScopedImports())
                  .then(
                    function (exprts) {
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
  async loadFromBytesAsync(promiseId, data) {
    try {
      if (!(await this.checkChecksumAsync(data))) {
        SocigyPromises.reject(promiseId, "Passed binaries are not valid");
        return;
      }
      const compiledModule = await WebAssembly.compile(data);
      this.exports = (
        await WebAssembly.instantiate(compiledModule, this.getScopedImports())
      ).exports;
      SocigyPromises.resolve(promiseId, null);
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
      SocigyInternal.onPluginInitialized(true, this.id, null);
    } catch (e) {
      SocigyInternal.onPluginInitialized(
        false,
        this.id,
        `Failed to initialize plugin(${this.id}): ` + e.toString()
      );
    }
  }
  async initializeAsync(promiseId) {
    try {
      this.api.initialize();
      this.api.main();
      SocigyPromises.resolve(promiseId, null);
    } catch (e) {
      SocigyPromises.reject(
        promiseId,
        `Failed to initialize plugin(${this.id}): ` + e.toString()
      );
    }
  }
  invokeCallbackAsync(promiseId, callbackId, data) {
    try {
      const callback = this.callbacks[callbackId];
      if (callback) callback(data);
      delete this.callbacks[callbackId];
      SocigyPromises.resolve(promiseId, null);
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
  renderComponent(componentId, props) {
    const result = this.api.render_component(componentId, props);
    SocigyUI.onComponentRender(this.id, componentId, result, null);
  }
}
globalThis.Socigy = { Instance: PluginInstance, loaded: {} };
export {};
