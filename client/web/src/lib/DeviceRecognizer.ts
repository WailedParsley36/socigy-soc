"use client";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpAgent;
try {
  fpAgent = await FingerprintJS.load();
} catch {}

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
