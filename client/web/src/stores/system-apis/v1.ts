export default class SystemApiV1 {
  async installPlugin(url: string) {
    const module = await WebAssembly.instantiateStreaming(fetch(url), {
      
    });
  }
  async installPluginFromData(data: Uint8Array) {
    await WebAssembly.instantiate(data);
  }
}
