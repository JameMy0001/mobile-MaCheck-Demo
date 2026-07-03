import { Stack } from 'expo-router';

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { requestNotificationPermissions, rescheduleAllCabinetMeds } from '../services/notificationService';

const calmHeader = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#14322A',
  headerTitleStyle: { color: '#14322A', fontWeight: '900' as const },
  headerShadowVisible: false,
};

export default function Layout() {
  const loadAllFromStorage = useAppStore((state) => state.loadAllFromStorage);
  const isLoaded = useAppStore((state) => state.isLoaded);
  const cabinet = useAppStore((state) => state.cabinet);

  useEffect(() => {
    loadAllFromStorage();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const initNotifications = async () => {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await rescheduleAllCabinetMeds(cabinet).catch(err => console.error(err));
        }
      };
      initNotifications();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return null; // Don't render screens until state is loaded
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'ลงทะเบียนผู้สูงอายุ', ...calmHeader, headerShown: false }} />
      <Stack.Screen name="scanner" options={{ title: 'สแกนเช็กยาตีกัน', ...calmHeader }} />
      <Stack.Screen name="cabinet" options={{ title: 'ตู้ยาของฉัน', ...calmHeader }} />
      <Stack.Screen name="food-clash" options={{ title: 'เช็กของแสลง', ...calmHeader }} />
      <Stack.Screen name="caregiver" options={{ title: 'หน้าจอลูกหลาน', ...calmHeader }} />
    </Stack>
  );
}
