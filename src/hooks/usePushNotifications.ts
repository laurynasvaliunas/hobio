import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { createLogger } from "../lib/logger";

const log = createLogger("Push");
const PROJECT_ID = "1b6481b2-6ed9-4c5d-8db5-90290c85ec52";

type NotificationData = { deeplink?: string; groupId?: string; type?: string } & Record<
  string,
  unknown
>;

function extractDeeplink(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as NotificationData;
  if (typeof d.deeplink === "string") return d.deeplink;
  if (typeof d.groupId === "string") return `/(tabs)/groups/${d.groupId}`;
  return null;
}

async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: PROJECT_ID,
  });

  const token = tokenData.data;

  // Store push token in Supabase profile
  await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);

  return token;
}

export function usePushNotifications(userId: string | undefined) {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Set handler here (inside effect) so it runs after the native bridge is ready
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    registerForPushNotifications(userId).catch((err) => {
      log.warn("registration_failed", { name: (err as Error)?.name });
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const type = (notification.request.content.data as NotificationData)?.type;
        log.event("received", { type: typeof type === "string" ? type : "unknown" });
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as unknown;
        const deeplink = extractDeeplink(data);
        log.event("response", { hasDeeplink: !!deeplink });
        if (deeplink) {
          try {
            router.push(deeplink as never);
          } catch (err) {
            log.warn("deeplink_navigate_failed", { name: (err as Error)?.name });
          }
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId]);
}
