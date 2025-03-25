import SystemApiV1 from "./v1";
import SystemApiV2 from "./v2";

export type SystemApiType = SystemApiV1 | SystemApiV2;

export const Versions = {
  "1.0.0": () => new SystemApiV1(),
  "2.0.0": () => new SystemApiV2(), // This implementation is working, it's just a showcase that it could be done
};
