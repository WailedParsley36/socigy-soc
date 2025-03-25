const fs = require("fs");
const path = require("path");
const UglifyJS = require("uglify-js");

function loadJsFileAsText(filename) {
  const filePath = path.join(__dirname, filename);
  return fs.readFileSync(filePath, "utf8");
}

function collectFirstPart(fileContent) {
  let startIndex = "let wasm;".length;
  let exportIndex = fileContent.indexOf("function debugString(", startIndex);
  const result = fileContent.substring(startIndex, exportIndex);
  exportIndex = fileContent.indexOf("export function", startIndex);

  return {
    content: result,
    index: exportIndex,
  };
}

function collectSecondPart(fileContent, startIndex) {
  const exportIndex = fileContent.indexOf("async function __", startIndex);

  let transformed = fileContent.substring(startIndex, exportIndex);
  const exportFunctionRegex =
    /export\s+function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;

  transformed = transformed.replace(
    exportFunctionRegex,
    (match, functionName, params, body) => {
      return `this.api.${functionName} = function ${functionName}(${params}) {${body}};`;
    }
  );

  return {
    content: transformed,
    index: exportIndex,
  };
}

function collectThirdPart(fileContent, startIndex) {
  startIndex = fileContent.indexOf("imports.wbg = {}", startIndex);

  const exportIndex = fileContent.indexOf("return imports;", startIndex);
  let result = fileContent.substring(startIndex, exportIndex);

  result = result.replace(
    /(imports\.wbg\.__wbindgen_debug_string\s*=\s*function\s*\([^)]*\)\s*)\{[\s\S]*?\}/,
    "$1{}"
  );
  result = result.replace(
    `imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };`,
    `imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        imports.logging.fatal(getStringFromWasm0(arg0, arg1), null);
    };`
  );

  return {
    content: result,
    index: exportIndex,
  };
}

const jsFileContent = loadJsFileAsText("output.js");
let apiFileContent = loadJsFileAsText("api.js");
console.log("Loaded output.js and api.js");
const firstPart = collectFirstPart(jsFileContent);
const secondPart = collectSecondPart(jsFileContent, firstPart.index);
const thirdPart = collectThirdPart(jsFileContent, secondPart.index);
console.log("Transforming...");
const finalOutput = firstPart.content + secondPart.content + thirdPart.content;

apiFileContent = apiFileContent
  .replace("export {};", "")
  .replace("// [IMPORT_HERE]", finalOutput)
  .replaceAll("wasm.", "Socigy.loaded[internal_plugin_id].exports.")
  .replaceAll("socigy.", "imports.");

const result = UglifyJS.minify(apiFileContent, {
  compress: {
    passes: 10, // Perform multiple compression passes for better optimization
    drop_console: true, // Remove console logs
    drop_debugger: true, // Remove debugger statements
  },
  mangle: true, // Rename variables and functions to reduce size
  output: {
    beautify: false, // Minify as much as possible
  },
});
// Check for errors
if (result.error) {
  console.error("UglifyJS Error:", result.error);
} else {
  // Write minified code to output file
  fs.writeFileSync(
    "api.min.js",
    result.code.replaceAll("${", "\\$\\{"),
    "utf8"
  );
  console.log("Minification complete. Output saved to api.min.js");
}
