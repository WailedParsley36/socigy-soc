import { LogLevel } from "@/managers/BaseManager";
import { Platform } from "react-native";

// const mainServer = "http://192.168.1.76";

// export default {
//     appVersion: "v1.0.0",
//     environment: {
//         logLevel: LogLevel.Debug
//     },
//     server: mainServer,
//     servers: {
//         auth: `${mainServer}/v1/auth`,
//         user: `${mainServer}/v1/user`,
//         plugin: `${mainServer}/v1/plugin`,
//     }
// }

let mainServer = "http://192.168.1.103";
if (Platform.OS == "web") {
  mainServer = "https://api.socigy.com";
}
const majorVersion = "v1";

export default {
  appVersion: `${majorVersion}.0.0`,
  environment: {
    logLevel: LogLevel.Debug,
  },
  server: mainServer,
  servers: {
    auth: `${mainServer}/${majorVersion}/auth`,
    user: `${mainServer}/${majorVersion}/user`,
    plugin: `${mainServer}/${majorVersion}/plugin`,
    content: `${mainServer}/${majorVersion}/content`,
  },
};
