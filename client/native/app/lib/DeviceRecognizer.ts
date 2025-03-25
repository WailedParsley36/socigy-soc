

import * as Fingerprint from '@expo/fingerprint';

let fpAgent;


// let deviceId;
// if (globalThis.localStorage) deviceId = localStorage.getItem("device-id");
// export const DeviceId = deviceId
//   ? { visitorId: deviceId }
//   : fpAgent
//   ? await fpAgent.get()
//   : null;

// if (DeviceId) localStorage.setItem("dvc-id", DeviceId.visitorId);

export const DeviceId = fpAgent
  ? await fpAgent.get()
  : globalThis?.localStorage
  ? { visitorId: localStorage.getItem("dvc-id") }
  : null;
