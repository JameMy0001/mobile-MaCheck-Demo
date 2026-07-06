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
  const language = useAppStore((state) => state.language);

  useEffect(() => {
    loadAllFromStorage();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const initNotifications = async () => {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await rescheduleAllCabinetMeds(cabinet, language).catch(err => console.error(err));
        }
      };
      initNotifications();
    }
  }, [isLoaded, cabinet, language]);

  if (!isLoaded) {
    return null; // Don't render screens until state is loaded
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: language === 'th' ? 'ลงทะเบียนและตั้งค่า' : 'Settings & Register', 
          ...calmHeader, 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="scanner" 
        options={{ 
          title: language === 'th' ? 'สแกนเช็กยาตีกัน' : 'Drug Clash Scanner', 
          ...calmHeader 
        }} 
      />
      <Stack.Screen 
        name="cabinet" 
        options={{ 
          title: language === 'th' ? 'ตู้ยาของฉัน' : 'My Cabinet', 
          ...calmHeader 
        }} 
      />
      <Stack.Screen 
        name="food-clash" 
        options={{ 
          title: language === 'th' ? 'เช็กของแสลง' : 'Food Clash Checker', 
          ...calmHeader 
        }} 
      />
      <Stack.Screen 
        name="caregiver" 
        options={{ 
          title: language === 'th' ? 'หน้าจอลูกหลาน' : 'Caregiver Monitor', 
          ...calmHeader 
        }} 
      />
    </Stack>
  );
}
