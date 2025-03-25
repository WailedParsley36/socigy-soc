let mainServer = "http://192.168.1.103";
const majorVersion = "v1";

export default {
  appVersion: `${majorVersion}.0.0`,
  server: mainServer,
  servers: {
    auth: `${mainServer}/${majorVersion}/auth`,
    user: `${mainServer}/${majorVersion}/user`,
    plugin: `${mainServer}/${majorVersion}/plugin`,
    content: `${mainServer}/${majorVersion}/content`,
  },
};
