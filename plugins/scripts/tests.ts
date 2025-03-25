import * as TestPlugin from "../example-plugin/pkg/example_plugin.js";
import fs from "node:fs";

const compiled = await WebAssembly.compile(
  fs.readFileSync("../example-plugin/pkg/example_plugin_bg.wasm")
);

globalThis.socigy = {
  log: console.log,
  error: console.error,
};

const output = TestPlugin.initSync({ module: compiled });

console.log("Initialized plugin", output);
output.main();
