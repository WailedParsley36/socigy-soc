// import { createContext, useEffect, useState } from "react";
// import { useAuthStore } from "./AuthStore";
// import SocigyWasm, { InternalEventData } from "socigy-wasm";
// import { Plugin } from "@/data/plugins/Plugin";
// import { AsyncResult } from "@/data/api/responses/AsyncResponse";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Alert } from "react-native";

// export class PluginInstance {
//   private id: string;
//   isInitialized: boolean = false;

//   getId() {
//     return this.id;
//   }

//   constructor(id: string) {
//     this.id = id;
//   }
// }

// export default class PluginManager {
//   private plugins: { [id: string]: PluginInstance } = {};
//   private pluginInfoCache: { [id: string]: Plugin } = {};

//   constructor() {
//     SocigyWasm.addListener(
//       "onPluginLoaded",
//       this.handlePluginLoaded.bind(this)
//     );
//     SocigyWasm.addListener(
//       "onPluginUnloaded",
//       this.handlePluginUnload.bind(this)
//     );
//     SocigyWasm.addListener(
//       "onPluginInitialized",
//       this.handlePluginInitialized.bind(this)
//     );
//     SocigyWasm.addListener("onError", (data) => {
//       console.error(data.message);
//     });
//     SocigyWasm.addListener("onLog", (data) => {
//      console.log(data.message);
//     });
//     SocigyWasm.addListener("onFatal", (data) => {
//       console.error(data.message);
//     });
//   }
//   unload() {
//     SocigyWasm.removeListener(
//       "onPluginLoaded",
//       this.handlePluginLoaded.bind(this)
//     );
//     SocigyWasm.removeListener(
//       "onPluginUnloaded",
//       this.handlePluginUnload.bind(this)
//     );
//     SocigyWasm.removeListener(
//       "onPluginInitialized",
//       this.handlePluginInitialized.bind(this)
//     );
//   }

//   private handlePluginInitialized(data: InternalEventData) {
//     if (!data.success) {
//       return;
//     }

//     this.plugins[data.pluginId].isInitialized = true;
//   }
//   private handlePluginUnload(data: InternalEventData) {
//     console.log(`Uninstalled ${data.pluginId} plugin`);
//     delete this.plugins[data.pluginId];
//   }
//   private async handlePluginLoaded(data: InternalEventData) {
//     console.log(`Installed ${data.pluginId} plugin`);

//     const instance = new PluginInstance(data.pluginId);
//     this.plugins[data.pluginId] = instance;

//     if (!this.pluginInfoCache[data.pluginId]) {
//       const info = await AsyncStorage.getItem(`pluginInfo-${data.pluginId}`);
//       if (info) {
//         this.pluginInfoCache[data.pluginId] = JSON.parse(info);
//       }
//     }

//     // Initializing the plugin
//     await SocigyWasm.initializePluginAsync(data.pluginId);
//     instance.isInitialized = true;
//   }

//   async initializeAsync() {
//     const loaded = SocigyWasm.getLoadedPlugins();
//     console.log("Loaded plugins:", loaded);
//     loaded.forEach((id) => {
//       this.plugins[id] = new PluginInstance(id);
//     });

//     console.log("PluginManager initialized");
//   }

//   getInstance(id: string): PluginInstance | undefined {
//     return this.plugins[id];
//   }
//   getInstances(): PluginInstance[] {
//     return Object.values(this.plugins);
//   }

//   async installPluginAsync(plugin: Plugin) {
//     console.log(`Installing ${plugin.id} plugin`);
//     await SocigyWasm.loadPluginAsync(plugin.id);
//     Alert.alert("TEST");

//     this.pluginInfoCache[plugin.id] = plugin;
//     this.plugins[plugin.id] = new PluginInstance(plugin.id);
//     await AsyncStorage.setItem(
//       `pluginInfo-${plugin.id}`,
//       JSON.stringify(plugin)
//     );
//     Alert.alert("TEST2");

//     await SocigyWasm.initializePluginAsync(plugin.id);
//     this.plugins[plugin.id].isInitialized = true;
//     Alert.alert("TEST3");
//   }
//   async uninstallPluginAsync(id: string) {
//    console.log(`Uninstalling ${id} plugin`);
//     await SocigyWasm.unloadPluginAsync(id);
//     await AsyncStorage.removeItem(`pluginInfo-${id}`);
//     delete this.pluginInfoCache[id];
//     delete this.plugins[id];
//   }

//   async queryPlugins(
//     query: string | undefined,
//     limit: number,
//     offset: number
//   ): Promise<Plugin[]> {
//     if (offset > 0) return [];
//     return [
//       {
//         id: "55df43f1-fa5d-4092-bf15-088663c39e87",
//         name: "Rust Example Plugin",
//         version: "1.0.0",
//         apiVersion: "^1.0.0",
//         systems: ["android", "windows", "linux"],
//         platforms: ["mobile", "desktop"],
//         authors: [
//           {
//             username: "Socigy",
//             tag: "0000",
//           },
//         ],
//         description:
//           "This is an example plugin using the Socigy Plugin - Rust UI kit",
//         language: "rust",
//         permissions: {
//           "socigy.ui.components.replace": {
//             description: "Required to change your profile page appearance",
//             link: "https://dev.socigy.com/docs/permissions/ui/components/replace",
//             required: true,
//             componentIds: [
//               "81fada10-0924-4f60-bfe8-51c0ac228297",
//               "f74be237-f439-4ef0-85a8-a773db41e8bd",
//             ],
//           },
//           "socigy.ui.components.delete": {
//             description:
//               "Required to delete some of the ugly default components",
//             link: "https://dev.socigy.com/docs/permissions/ui/components/delete",
//             required: true,
//             componentIds: [
//               "81fada10-0924-4f60-bfe8-51c0ac228297",
//               "f74be237-f439-4ef0-85a8-a773db41e8bd",
//             ],
//           },
//         },
//       },
//     ];
//   }
//   async getPluginRecommendations(
//     limit: number,
//     offset: number
//   ): Promise<AsyncResult<Plugin[]>> {
//     return {
//       result: [
//         {
//           id: "55df43f1-fa5d-4092-bf15-088663c39e87",
//           name: "Rust Example Plugin",
//           version: "1.0.0",
//           apiVersion: "^1.0.0",
//           systems: ["android", "windows", "linux"],
//           platforms: ["mobile", "desktop"],
//           authors: [
//             {
//               username: "Socigy",
//               tag: "0000",
//             },
//           ],
//           description:
//             "This is an example plugin using the Socigy Plugin - Rust UI kit",
//           language: "rust",
//           permissions: {
//             "socigy.ui.components.replace": {
//               description: "Required to change your profile page appearance",
//               link: "https://dev.socigy.com/docs/permissions/ui/components/replace",
//               required: true,
//               componentIds: [
//                 "81fada10-0924-4f60-bfe8-51c0ac228297",
//                 "f74be237-f439-4ef0-85a8-a773db41e8bd",
//               ],
//             },
//           },
//         },
//       ],
//     };
//   }

//   isInstalled(id: string): boolean {
//     return !!this.plugins[id];
//   }

//   async getInstalledPlugins(
//     limit: number,
//     offset: number
//   ): Promise<AsyncResult<Plugin[]>> {
//     return {
//       result: SocigyWasm.getLoadedPlugins()
//         .slice(offset, offset + limit)
//         .map((x) => this.pluginInfoCache[x]),
//     };
//   }

//   async getUserDevicesStatusForPlugin(
//     id: string
//   ): Promise<{ name: string; installed: boolean }[]> {
//     return [
//       { name: "Smatphone - 12T Pro", installed: false },
//       { name: "TV - Samsung 55'QLED", installed: false },
//       { name: "PC - Chrome", installed: true },
//     ];
//   }

//   async getPluginAsync(id: string): Promise<AsyncResult<Plugin>> {
//     return {
//       result: {
//         id: "55df43f1-fa5d-4092-bf15-088663c39e87",
//         name: "Rust Example Plugin",
//         version: "1.0.0",
//         apiVersion: "^1.0.0",
//         systems: ["android", "windows", "linux"],
//         platforms: ["mobile", "desktop"],
//         authors: [
//           {
//             username: "Socigy",
//             tag: "0000",
//           },
//         ],
//         description:
//           "This is an example plugin using the Socigy Plugin - Rust UI kit",
//         language: "rust",
//         permissions: {
//           "socigy.ui.components.replace": {
//             description: "Required to change your profile page appearance",
//             link: "https://dev.socigy.com/docs/permissions/ui/components/replace",
//             required: true,
//             componentIds: [
//               "81fada10-0924-4f60-bfe8-51c0ac228297",
//               "f74be237-f439-4ef0-85a8-a773db41e8bd",
//             ],
//           },
//           "socigy.ui.components.delete": {
//             description:
//               "Required to delete some of the ugly default components",
//             link: "https://dev.socigy.com/docs/permissions/ui/components/delete",
//             required: true,
//             componentIds: [
//               "81fada10-0924-4f60-bfe8-51c0ac228297",
//               "f74be237-f439-4ef0-85a8-a773db41e8bd",
//             ],
//           },
//         },
//       },
//     };
//   }
// }

// export interface PluginState {
//   isInitialized: boolean;
//   manager?: PluginManager
// }

// const manager = new PluginManager()

// interface PluginContextType extends PluginState {}
// export const PluginContext = createContext<PluginContextType | null>({ manager: manager, isInitialized: false });

// export function PluginProvider({ children }: any) {
//   const auth = useAuthStore();

//   const [state, setState] = useState<PluginState>({
//     isInitialized: false,
//     manager: manager
//   });

//   const handlePluginInitialized =(data: InternalEventData)=> {
//     if (!data.success) {
//       return;
//     }

//     this.plugins[data.pluginId].isInitialized = true;
//   }
//   private handlePluginUnload(data: InternalEventData) {
//    console.log(`Uninstalled ${data.pluginId} plugin`);

//     delete this.plugins[data.pluginId];
//   }
//   private async handlePluginLoaded(data: InternalEventData) {
//    console.log(`Installed ${data.pluginId} plugin`);

//     const instance = new PluginInstance(data.pluginId);
//     this.plugins[data.pluginId] = instance;

//     if (!this.pluginInfoCache[data.pluginId]) {
//       const info = await AsyncStorage.getItem(`pluginInfo-${data.pluginId}`);
//       if (info) {
//         this.pluginInfoCache[data.pluginId] = JSON.parse(info);
//       }
//     }

//     // Initializing the plugin
//     await SocigyWasm.initializePluginAsync(data.pluginId);
//     instance.isInitialized = true;
//   }

//   const initialize = async () => {
//     SocigyWasm.addListener(
//       "onPluginLoaded",
//       this.handlePluginLoaded.bind(this)
//     );
//     SocigyWasm.addListener(
//       "onPluginUnloaded",
//       this.handlePluginUnload.bind(this)
//     );
//     SocigyWasm.addListener(
//       "onPluginInitialized",
//       this.handlePluginInitialized.bind(this)
//     );

//     setState((prev) => ({
//       ...prev,
//       isInitialized: true,
//     }));
//   };

//   useEffect(() => {
//     initialize();
//   }, []);

//   const contextValue: PluginContextType = {
//     ...state,
//   };

//   return (
//     <PluginContext.Provider value={contextValue}>
//       {children}
//     </PluginContext.Provider>
//   );
// }
