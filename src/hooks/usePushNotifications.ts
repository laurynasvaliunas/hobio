import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "../lib/supabase";

const PROJECT_ID = "1b6481b2-6ed9-4c5d-8db5-90290c85ec52";

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
    if (!userId) return;

    registerForPushNotifications(userId).catch((err) => {
      if (__DEV__) console.warn("[Push] Registration failed:", err);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        if (__DEV__) console.log("[Push] Received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (__DEV__) console.log("[Push] Response:", response);
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
