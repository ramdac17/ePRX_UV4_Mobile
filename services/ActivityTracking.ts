import notifee, {
  AndroidImportance,
  AndroidColor,
} from "@notifee/react-native";

export const startLiveTracking = async (activityName: string) => {
  // 1. Request permissions (Required for Android 13+)
  await notifee.requestPermission();

  // 2. Create a High Importance Channel
  const channelId = await notifee.createChannel({
    id: "eprx-activity",
    name: "Activity Tracking",
    lights: true,
    lightColor: AndroidColor.LIME, // ePRX Brand Color
    importance: AndroidImportance.HIGH,
  });

  // 3. Display the notification as a Foreground Service
  await notifee.displayNotification({
    id: "active-session", // Constant ID so it updates the same notification
    title: `<span style="color: #d4ff00;">ePRX</span> ${activityName} IN PROGRESS`,
    body: "Tracking your performance beyond the mile...",
    android: {
      channelId,
      asForegroundService: true, // 👈 KEY: Keeps app alive while locked
      ongoing: true, // Prevents accidental dismissal
      color: "#d4ff00",
      pressAction: { id: "default" },

      // ⏱️ THE LOCK SCREEN TIMER LOGIC
      showChronometer: true, // Displays the live count-up timer

      // OPTIONAL: Add a "Stop" button directly on the lock screen
      actions: [
        {
          title: "STOP SESSION",
          pressAction: { id: "stop-activity" },
        },
      ],
    },
  });
};

export const stopLiveTracking = async () => {
  await notifee.stopForegroundService();
  // Optional: clear the notification entirely
  // await notifee.cancelNotification('active-session');
};
