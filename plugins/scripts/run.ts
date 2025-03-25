import * as TestPlugin from "../example-plugin/pkg/example_plugin.js";
import fs from "node:fs";
import { Permissions as PermissionsMock } from "./mock/permissions.js";

interface VDOMChange {
  type:
    | "addElement"
    | "removeElement"
    | "replaceElement"
    | "updateText"
    | "updateProps"
    | "updateChildren"
    | "updateChild"
    | "removeChildren"
    | "updateStyle"
    | "removeAll";
  path?: number[];
}

const compiled = await WebAssembly.compile(
  fs.readFileSync("../example-plugin/pkg/example_plugin_bg.wasm")
);

let output: TestPlugin.InitOutput = null!;

function colorizeLogs(message: string): string {
  let index = message.indexOf("INFO");
  if (index !== -1) {
    return (
      message.slice(0, index) + "\x1b[36mINFO\x1b[0m" + message.slice(index + 4)
    );
  }

  index = message.indexOf("DEBUG:");
  if (index !== -1) {
    return (
      message.slice(0, index) +
      "\x1b[1;37mDEBUG\x1b[0m" +
      message.slice(index + 5)
    );
  }

  index = message.indexOf("WARN:");
  if (index !== -1) {
    return (
      message.slice(0, index) + "\x1b[33mWARN\x1b[0m" + message.slice(index + 4)
    );
  }

  index = message.indexOf("ERROR:");
  if (index !== -1) {
    return (
      message.slice(0, index) +
      "\x1b[31mERROR\x1b[0m" +
      message.slice(index + 5)
    );
  }

  index = message.indexOf("FATAL:");
  if (index !== -1) {
    let arrowIndex = message.indexOf("=> ");
    if (arrowIndex === -1) arrowIndex = undefined;
    return (
      "\x1b[1;31m" +
      message.slice(0, index) +
      "\x1b[31;1;4mFATAL\x1b[0m\x1b[1;31m\x1b[0m" +
      message.slice(index + 5)
    );
  }

  return message;
}

const permissions = new PermissionsMock();

function apiLog(...rest) {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  const formattedTime = `${hours}:${minutes}:${seconds}:${ms}`;
  console.log(`${formattedTime}   \x1b[1;35mAPI\x1b[0m:`, ...rest);
}

let results = 0;
let events = {};
let components = new Set();
let onChange: (changes: VDOMChange[]) => void = null!;

const uuidArray = [
  "081c6297-ae56-41d9-afbe-c398dd5173d1",
  "479ac2a8-68ae-4588-aa0f-ec20b8070120",
  "9497272d-7af4-4e14-90ee-db9795c0e2bd",
  "2cf14530-5fc6-4008-93f3-c38b7f2bbf06",
  "e6c0580a-b75b-4fec-8960-e7a605550c0c",
  "0d893eeb-da6b-4743-b1ab-1859beda9524",
  "d2a01f3f-a6c8-4a1f-bf9c-308195ee50e7",
  "1b65859a-07f3-4748-9007-d498a1e17ed5",
  "6307193d-7803-4718-b2a2-5ff5e8064f9e",
  "ebe48aeb-1b62-4203-92b9-964d2abd34d9",
  "da283db1-15b8-450b-90a3-c289d1c2c715",
  "f2c68262-0f30-495b-af9a-ef9b68c08188",
  "7f2defe8-917c-4e05-8971-b8aa1f94fde8",
  "8f305cd3-3d44-4c84-9d96-28885fa1b9a5",
  "b33d6cf2-8d72-4b05-b07b-883fc2d20b5d",
  "3f9a47b4-889a-47e6-b8fb-dea0573587b1",
  "515434a8-79a3-469e-9291-d090d790c5ae",
  "db6c0df5-b726-4d61-bf0a-85bfa5e9f7a7",
  "1ac7de68-5966-4aca-b74a-81f3c465a67c",
  "1ec71b5d-0fcf-40df-911e-4fbe46a6ac18",
  "08729b70-afd6-4cd8-ad55-8723a476169a",
  "f7841aa5-39da-4e0a-a7da-ca6eb296d45b",
  "d97ed542-2d73-4226-8f29-719a61873806",
  "ec48eb71-5cb4-472f-8f0d-c1ce373a9a56",
  "d4baa518-7d04-4649-99ff-e4e7f19a5d95",
  "00ccf5da-e41a-481c-a5b4-2596550b5944",
  "9588ca80-bff4-4889-be93-908df9a63c22",
  "58471817-a579-4dbb-beb6-9eb532bce856",
  "c968c263-7655-485d-a07b-1ccf08d4a5ae",
  "3809d31d-b20b-4ddb-bc3e-547372bdd213",
  "b6385bf1-f6e6-49be-ae1d-c21e7e3505ab",
  "8b3dac80-cdc4-44db-ad18-b89e35914b75",
  "9b986697-85d6-4131-9f28-e87adbca9e56",
  "dc1af522-fc76-421d-b4c9-3ce3a6e7c27f",
  "3e27df9a-e978-4085-b22e-fc37e4b9868b",
  "8d12762b-0afe-4187-8822-e01d649e0db7",
  "45137fb2-8996-4628-a899-88b5ccc85184",
  "6915c069-9d34-41b5-994c-fa417d2d100f",
  "18cbf20f-9f05-4996-8d02-d92446a8a320",
  "f1483dc9-3171-45c7-8fe9-a2cd7aa09661",
  "151a272d-ff83-4e7e-b7c5-edcaa580679e",
  "dd1e7088-439b-4ae9-9d5e-5247673d18a6",
  "149a58f5-9d01-4548-ac45-45983475f532",
  "d1c59015-f5b1-4af3-a64f-b1bd6a018082",
  "acb5b1ca-99b8-4a56-8254-4d0ee40ed8ad",
  "f2e946ec-a5d8-45e1-956b-69044350846f",
  "e5bcd93e-3932-4f9d-a807-34443d400b3a",
  "84af71d4-d172-4beb-a45e-1e7fca93617e",
  "7706e791-631b-4a27-a7c3-bc4717136261",
  "489249ff-5970-4639-80a9-a728dc44539b",
];

globalThis.socigy = {
  logging: {
    log: (message: string) => console.log(colorizeLogs(message)),
    error: (message: string, showUi: boolean, uiDelay: number) => {
      console.error(colorizeLogs(message));
    },
    fatal: (message: string, uiDelay: number) => {
      console.error(
        `\x1b[31mAPI-FATAL:\x1b[0m Plugin has exited with: ${message}`
      );
      output = null;
    },
  },
  permissions: {
    getDeclaredPermissions: (callbackId: string) => {
      TestPlugin.invoke_rust_callback(
        callbackId,
        JSON.stringify(permissions.getDeclaredPermissions())
      );
    },
    getPermissionsAsync: (callbackId: string) => {
      TestPlugin.invoke_rust_callback(
        callbackId,
        JSON.stringify(permissions.getPermissions())
      );
    },
    requestPermissionsAsync: (
      callbackId: string,
      requestedPermissions: string[]
    ) => {
      apiLog("Plugin requested these permissions: ", requestedPermissions);
      TestPlugin.invoke_rust_callback(
        callbackId,
        JSON.stringify(permissions.requestPermissions(requestedPermissions))
      );
    },
  },
  device: {},
  utils: {
    crypto: {
      randomV4Uuid(): string {
        const randomIndex = Math.floor(Math.random() * uuidArray.length);
        return uuidArray[randomIndex];
      },
    },
  },
  ui: {
    events: {
      addEventListener(id: string, listener: (e: UIEvent) => void) {
        events[id] = listener;
        apiLog("Registered UI Event", id);
      },
      removeEventListener(id: string) {
        delete events[id];
        apiLog("Removed UI Event", id);
      },
    },
    render: {
      processComponentRenderChanges(id: string, changes_str: string) {
        let changes = JSON.parse(changes_str) as VDOMChange[];
        apiLog("Renderer sent changes for component", id, changes);
        onChange(changes);
      },
      processAppRenderChanges(id: string, changes_str: string) {},
    },
    registerComponent(id: string) {
      components.add(id);
      apiLog("UI Component registered", id);
    },
    removeComponent(id: string) {
      components.delete(id);
      apiLog("UI Component deleted", id);
    },
    onAppWindowRender: (id: string, instance: number, result: string) => {
      // apiLog(`AppWindow(${id}) instance ${instance} has rendered: `, result)
      results++;
    },
  },
};
output = TestPlugin.initSync({ module: compiled });

async function initializePlugin() {
  TestPlugin.initialize();
  apiLog("Socigy implementation initialized");

  TestPlugin.main();
  apiLog("User plugin initialized");
}

async function v3() {
  let vdom;
  function traverse(vdom: any, path: number[], index: number = 1): any {
    if (index >= path.length) return vdom;

    try {
      let foundChild = vdom.children[path[index]];
      index++;
      if (index >= path.length) return vdom;
      return traverse(foundChild, path, index);
    } catch {
      apiLog("Failed to find the element at the specified path");
    }
  }

  onChange = (changes) => {
    if (!changes) return;

    changes.forEach((x) => {
      let result = traverse(vdom, x.path, 1);
      switch (x.type) {
        case "updateChildren":
          result.children[x.path[x.path.length - 1]].children = (
            x as any
          ).children;
          break;

        case "updateChild":
          result.children[x.path[x.path.length - 1]] = (x as any).child;
          break;
      }
    });

    apiLog("Updated VDOM", vdom);
  };
  const rawRender = TestPlugin.render_component(
    components.values().next().value,
    '{"renderString": true,"content":"Nazdar","imageUrl":"https://socigy.com/favicon/favicon.svg"}'
  );
  apiLog("Plugin component render:", rawRender);
  vdom = JSON.parse(rawRender);
  apiLog("Plugin VDOM:", vdom);

  TestPlugin.invoke_ui_event(
    vdom.events.onLayout[0],
    JSON.stringify({
      type: "onLayout",
      layout: { x: 0, y: 0, width: 0, height: 0 },
    })
  );

  TestPlugin.render_component(
    components.values().next().value,
    '{"renderString": false,"content":"Nazdar","imageUrl":"https://socigy.com/favicon/favicon.svg"}'
  );
  apiLog("2nd render VDOM:", JSON.stringify(vdom));
}

await initializePlugin();
await v3();
