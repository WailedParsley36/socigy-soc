import NotificationManager from "./V1NotificationManager"

export type NotificationManagerType = ActualNotificationType;
export type ActualNotificationType = NotificationManager;

export const NotificationManagerId = "notification"

export const NotificationVersions: { [version: string]: () => NotificationManager } = {
    "v1.0.0": () => new NotificationManager(),
}