import notifee, { AndroidImportance } from "@notifee/react-native";

export async function startLiveTracking(data: { title: string; body: string }) {
  const channelId = await notifee.createChannel({
    id: "session-telemetry-v3", // Incrementing ID again to reset system alerts
    name: "Mission Telemetry",
    importance: AndroidImportance.LOW, // Keeps it quiet
  });

  try {
    await notifee.displayNotification({
      id: "activity-session",
      title: data.title,
      body: data.body,
      android: {
        channelId,
        onlyAlertOnce: true, // No more annoying beeps every second
        foregroundServiceTypes: [1 as any],
        asForegroundService: true,
        ongoing: true,
        importance: AndroidImportance.LOW,
        color: "#D4FF00",
        pressAction: {
          id: "default",
        },
      },
    });
  } catch (err) {
    console.error("ePRX: Start Tracking Error", err);
  }
}

export async function stopLiveTracking() {
  try {
    await notifee.stopForegroundService();
    await notifee.cancelNotification("activity-session");
  } catch (error) {
    console.error("ePRX: Stop Tracking Error", error);
  }
}
