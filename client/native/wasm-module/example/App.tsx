import SocigyWasm from "socigy-wasm";
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import Dynamic, { UIRegistry } from "./Dynamic";
import React from "react";

const uiRegistry = new UIRegistry();
export default function App() {
  // TODO: Implement UI registry
  // TODO: Implement Plugin Component renderer (<External id="1234-1234" />)
  const [languages, setLanguages] = useState<string[]>();
  const [plugins, setPlugins] = useState<string[]>();
  const [props, setProps] = useState<boolean>(false);
  const [componentId, setComponentId] = useState<string>();

  const registeredComponents = uiRegistry.getRegisteredComponents();
  const componentCopies = Array(1).fill(1);

  const [eventId, setEventId] = useState<string>();

  useEffect(() => {
    async function AsyncProcessing() {
      try {
        setLanguages(SocigyWasm.getLoadedLanguages());
        setPlugins(SocigyWasm.getLoadedPlugins());
      } catch (e) {
        console.error(e);
      }
    }

    SocigyWasm.addListener("onPluginLoaded", (data) => {
      console.log("LOADED - ", data);
      setPlugins(SocigyWasm.getLoadedPlugins());
      setLanguages(SocigyWasm.getLoadedLanguages());
      if (data.success) SocigyWasm.initializePluginAsync(data.pluginId);
    });
    SocigyWasm.addListener("onPluginInitialized", (data) => {
      console.log("INITIALIZED - ", data);
      setPlugins(SocigyWasm.getLoadedPlugins());
      setLanguages(SocigyWasm.getLoadedLanguages());
    });
    SocigyWasm.addListener("registerComponent", (data) => {
      setComponentId(data.componentId);
    });

    SocigyWasm.addListener("onFatal", (data) => {
      console.log(`FATAL - ${data.message}`);
    });

    SocigyWasm.addListener("onError", (data) => {
      console.log(`ERROR - ${data.message}`);
    });

    SocigyWasm.addListener("onLog", (data) => {
      console.log(`LOG   - ${data.message}`);
    });

    SocigyWasm.addListener("onComponentRender", (data) => {
      if (data.result) {
        try {
          const result = JSON.parse(data.result);
          console.log("EVENTS", result.events);
          setEventId(result.events["onLayout"][0]);
        } catch {}
      }
    });

    SocigyWasm.addListener("getPermissions", async (data) => {
      console.log(`Oh my god - Get permissions`, data);
      await SocigyWasm.invokeJsCallbackAsync(
        data.pluginId,
        JSON.stringify([]),
        data.callbackId
      );
    });

    SocigyWasm.addListener("getDeclaredPermissions", async (data) => {
      console.log(`Oh my god - Get declared permissions`, data);
      await SocigyWasm.invokeJsCallbackAsync(
        data.pluginId,
        JSON.stringify([]),
        data.callbackId
      );
    });

    SocigyWasm.addListener("requestPermissions", async (data) => {
      console.log(`Oh my god - Request permissions`, data);
      await SocigyWasm.invokeJsCallbackAsync(
        data.pluginId,
        JSON.stringify([]),
        data.callbackId
      );
    });
    AsyncProcessing();

    return () => {
      SocigyWasm.removeAllListeners("onFatal");
      SocigyWasm.removeAllListeners("onLog");
      SocigyWasm.removeAllListeners("onError");
      SocigyWasm.removeAllListeners("getPermissions");
      SocigyWasm.removeAllListeners("onPluginLoaded");
      SocigyWasm.removeAllListeners("onPluginInitialized");
      SocigyWasm.removeAllListeners("getDeclaredPermissions");
      SocigyWasm.removeAllListeners("requestPermissions");
    };
  }, []);

  const loadTestPlugin = async () => {
    try {
      await SocigyWasm.loadPluginAsync("55df43f1-fa5d-4092-bf15-088663c39e87");
      console.log("REACT - Plugin was loaded successfully");
      setPlugins(SocigyWasm.getLoadedPlugins());
      setLanguages(SocigyWasm.getLoadedLanguages());
    } catch (e) {
      console.error("REACT - Plugin was not loaded:", e);
    }
  };

  const unloadPlugin = async () => {
    try {
      await SocigyWasm.unloadPluginAsync(
        "55df43f1-fa5d-4092-bf15-088663c39e87"
      );
      console.log("COMPONENT EXISTS", uiRegistry.componentExists(componentId!));
      setComponentId(undefined);
      setPlugins(SocigyWasm.getLoadedPlugins());
      setLanguages(SocigyWasm.getLoadedLanguages());
    } catch (e) {
      console.error("REACT - Plugin was not unloaded:", e);
    }
  };

  const initializePlugin = async () => {
    try {
      await SocigyWasm.initializePluginAsync(
        "55df43f1-fa5d-4092-bf15-088663c39e87"
      );
      console.log("Plugin was initialized successfully");
    } catch (e) {
      console.error("Plugin was not loaded:", e);
    }
  };

  const invokeUIEvent = () => {
    try {
      SocigyWasm.invokeUiEvent(
        "55df43f1-fa5d-4092-bf15-088663c39e87",
        eventId!,
        JSON.stringify({
          type: "onLayout",
          layout: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
        })
      );
    } catch (e) {
      console.error("Plugin was not loaded:", e);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          marginVertical: 25,
          textAlign: "center",
          fontSize: 28,
        }}
      >
        Socigy Plugins - Example
      </Text>
      <ScrollView
        scrollEnabled
        contentContainerStyle={{
          display: "flex",
        }}
      >
        <View>
          <View style={{ marginBottom: 25 }}>
            <Text>Wasm Supported: {SocigyWasm.isSupported ? "Yes" : "No"}</Text>
            <Text>Loaded languages: {languages?.length}</Text>
            {languages?.map((x) => (
              <View key={x}>
                <Text style={{ fontWeight: 800 }}>
                  {"    "}
                  {x}
                </Text>
                <Text style={{ fontWeight: 500 }}>
                  {"        "}
                  {SocigyWasm.getLoadedVersionsForLanguage(x)}
                </Text>
              </View>
            ))}

            <Text>Loaded Plugins: {plugins?.length}</Text>
            {plugins?.map((x) => (
              <Text key={x} style={{ fontWeight: 700 }}>
                {"    "}
                {x}
              </Text>
            ))}

            <Text>Registered Components: </Text>
            {registeredComponents.map((x) => (
              <Text key={x[0]} style={{ fontWeight: 700 }}>
                {"    "}
                {x[0]}
              </Text>
            ))}
          </View>
          <Text style={{ fontWeight: 800, fontSize: 20 }}>
            Loaded Plugin Component
          </Text>
          <View>
            {componentCopies.map((x, index) => {
              return componentId ? (
                <Dynamic
                  key={index}
                  id={componentId}
                  defaultElement={<Text>Loading, please wait...</Text>}
                  props={{
                    renderString: props,
                    content: "Nazdar",
                    imageUrl: "https://socigy.com/favicon/favicon.svg",
                  }}
                  uiRegistry={uiRegistry}
                />
              ) : (
                <Text key={index}>No component has been registered</Text>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View>
        <TouchableOpacity
          activeOpacity={0.75}
          style={{
            borderBottomWidth: 1,
            borderColor: "grey",
            paddingVertical: 20,
            backgroundColor: "#334155",
          }}
          onPress={loadTestPlugin}
        >
          <Text style={{ textAlign: "center", color: "white" }}>
            Load Plugin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          style={{ paddingVertical: 20, backgroundColor: "#334155" }}
          onPress={initializePlugin}
        >
          <Text style={{ textAlign: "center", color: "white" }}>
            Initialize Plugin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          style={{ paddingVertical: 20, backgroundColor: "#334155" }}
          onPress={() => setProps((prev) => !prev)}
        >
          <Text style={{ textAlign: "center", color: "white" }}>
            Change Component Props
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          style={{ paddingVertical: 20, backgroundColor: "#334155" }}
          onPress={invokeUIEvent}
        >
          <Text style={{ textAlign: "center", color: "white" }}>
            Invoke UI Event
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          style={{ paddingVertical: 20, backgroundColor: "#334155" }}
          onPress={unloadPlugin}
        >
          <Text style={{ textAlign: "center", color: "white" }}>
            Unload plugin
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
