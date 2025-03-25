import { AppState, BaseManager, LogLevel } from "../BaseManager";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from "react-native";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
    })
})

export default class NotificationManager extends BaseManager {
    private pushToken?: string

    constructor() {
        super("NotificationManager", "v1.0.0")
    }

    async initializeAsync(logLevel: LogLevel, updateState: (state: AppState) => void): Promise<AppState> {
        this.logger._setLogLevel(logLevel)
        this.updateState = updateState;


        if (Platform.OS == 'web') {
            this.registerServiceWorker();
            return AppState.Created;
        }

        this.logger.info("Initializing push notifications...")
        await this.setupPushToken();

        // Notifications.scheduleNotificationAsync({
        //     content: {
        //         title: "Heyyyy",
        //         body: "Test of local notification"
        //     },
        //     trigger: { channelId: "default" }
        // });

        return AppState.Created;
    }

    async createNotificationsChannels() {
        this.logger.debug("Notifications channel are beign created");

        await Notifications.setNotificationChannelAsync("messages", {
            name: "Messages",
            showBadge: true,
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        })

        await Notifications.setNotificationChannelAsync("default", {
            name: "General",
            showBadge: false,
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        })
    }

    async setupPushToken() {
        await this.createNotificationsChannels();
        let currentPermissions = await this.getPermissionAsync();
        if (!currentPermissions.granted) {
            currentPermissions = await this.requestPermissionAsync();
        }

        if (!currentPermissions.granted)
            return;

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        this.pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

        this.logger.debug("Your PUSH_TOKEN: ", this.pushToken);
    }

    private async pushTokenChangedListener(token: Notifications.DevicePushToken) {
        this.logger.info("Push token was changed...")
    }

    async getPermissionAsync() {
        return await Notifications.getPermissionsAsync();
    }

    async requestPermissionAsync() {
        return await Notifications.requestPermissionsAsync();
    }


    async registerServiceWorker() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                // Ensure the registration path is correct
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered with scope:', registration.scope);

                // Check for existing subscription
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    // Request push subscription
                    const convertedVapidKey = this.urlBase64ToUint8Array('BH3F9fOECmscOuwlSSRipfbUhtIXztupAOWzeTyz3r0wWcu9RzQJOYEpssoqgA7-4Qhd73MlsdcMPlSbm-Q-imQ');

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });
                }

                const currentUserString = localStorage.getItem('currentUser');
                if (currentUserString) {
                    const currentUser = JSON.parse(currentUserString);
                    const token = currentUser.apiToken;

                    const apiUrl = process.env.EXPO_PUBLIC_API_ENDPOINT;

                    // Send subscription to the server
                    await fetch(`${apiUrl}/update_push_token`, {
                        method: 'POST',
                        body: JSON.stringify({ push_token: subscription }),
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }

                console.log('Push subscription:', subscription);
            } catch (error) {
                console.error('Error during service worker registration:', error);
            }
        } else {
            console.warn('Push messaging is not supported');
        }
    }

    // Convert VAPID key
    urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}