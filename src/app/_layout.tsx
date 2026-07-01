import { Stack } from 'expo-router';

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { requestNotificationPermissions, rescheduleAllCabinetMeds } from '../services/notificationService';

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
      <Stack.Screen name="register" options={{ title: 'ลงทะเบียนผู้สูงอายุ', headerStyle: { backgroundColor: '#2196F3' }, headerTintColor: '#fff', headerShown: false }} />
      <Stack.Screen name="scanner" options={{ title: 'สแกนเช็กยาตีกัน', headerStyle: { backgroundColor: '#FF5252' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="cabinet" options={{ title: 'ตู้ยาของฉัน', headerStyle: { backgroundColor: '#4CAF50' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="food-clash" options={{ title: 'เช็กของแสลง', headerStyle: { backgroundColor: '#FFEB3B' }, headerTintColor: '#000' }} />
      <Stack.Screen name="caregiver" options={{ title: 'หน้าจอลูกหลาน (Mirror)', headerStyle: { backgroundColor: '#9C27B0' }, headerTintColor: '#fff' }} />
    </Stack>
  );
}
