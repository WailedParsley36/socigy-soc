export enum DeviceType {
  Unknown = 1,
  App = 2,
  Browser = 4,
  Android = 8,
  Windows = 16,
  TvOS = 32,
  IOS = 64,
  MacOSx = 128,
  Mobile = 256,
  Chrome = 512,
  Brave = 1024,
  Linux = 2048,
  iPad = 4096,
  Edge = 8192,
  Safari = 16384,
}

export interface Device {
  id: number;

  deviceName: string;
  deviceType: DeviceType;

  isNew: boolean;
  isBlocked: boolean;
  isTrusted: boolean;
  isCurrent: boolean;

  lastUsedAt: Date;
  createdAt: Date;
}
