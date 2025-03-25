// Reexport the native module. On web, it will be resolved to SocigyWasmModule.web.ts
// and on native platforms to SocigyWasmModule.ts
export { default } from './SocigyWasmModule';
export * from  './SocigyWasm.types';
