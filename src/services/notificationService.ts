import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CabinetMed } from '../store/useAppStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request system permissions for local notifications
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

/**
 * Parses times like "08:00, 12:00, 18:00" or "08:00" and schedules daily alerts
 */
export async function rescheduleAllCabinetMeds(cabinet: CabinetMed[]): Promise<void> {
  if (Platform.OS === 'web') return;

  // 1. Cancel all existing notifications first to avoid duplication
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Loop through all cabinet medicines and schedule active ones
  for (const med of cabinet) {
    if (med.suspended) continue; // Skip suspended medications

    if (med.time) {
      // Split by comma and clean whitespace
      const timeList = med.time.split(',').map(t => t.trim());
      
      for (const timeStr of timeList) {
        const timeParts = timeStr.split(':');
        if (timeParts.length === 2) {
          const hour = parseInt(timeParts[0], 10);
          const minute = parseInt(timeParts[1], 10);

          if (!isNaN(hour) && !isNaN(minute)) {
            const riskWarning = med.isHighRisk ? '⚠️ ยากลุ่มอันตรายสูงเฝ้าระวัง' : '💊 ยาทานทั่วไป';
            const medDosage = med.dosage ? ` (${med.dosage})` : '';
            
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${riskWarning} ถึงเวลาทานยาแล้วค่ะคุณตา`,
                body: `ทานยา: ${med.name}${medDosage} ตามเวลาแพทย์สั่งอย่างปลอดภัยด้วยนะคะ ❤️`,
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
              },
            });
          }
        }
      }
    }
  }
}
