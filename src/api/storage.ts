import AsyncStorage from '@react-native-async-storage/async-storage';
import { localAIFallbackDB } from '../assets/db/drugs';
import { syncActivityLogsWithBackend } from './sync';

const CUSTOM_MEDS_KEY = '@custom_meds_db';
const ACTIVITY_LOGS_KEY = '@activity_logs';

export interface ActivityLog {
  id: string;
  timestamp: string;
  text: string;
}

export const getCustomMeds = async (): Promise<any[]> => {
  try {
    const stored = await AsyncStorage.getItem(CUSTOM_MEDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to get custom meds', e);
    return [];
  }
};

export const saveCustomMed = async (med: {
  name: string;
  dosage?: string;
  shape?: string;
  notes?: string;
  storageTh?: string;
  severity: 'green' | 'yellow' | 'red';
  clashWith?: string[];
  diseases?: string[];
  descTh: string;
  speechTh: string;
}) => {
  try {
    const current = await getCustomMeds();
    const isDuplicate = current.some(m => m.name.toLowerCase() === med.name.toLowerCase());
    if (isDuplicate) return;

    const newMed = {
      ...med,
      id: 'custom_' + Date.now(),
      keywords: [med.name.toLowerCase(), med.name],
      formalName: `${med.name} (${med.dosage || 'ไม่ระบุขนาด'})`
    };

    const updated = [...current, newMed];
    await AsyncStorage.setItem(CUSTOM_MEDS_KEY, JSON.stringify(updated));
    await addActivityLog(`เพิ่มข้อมูลยาตัวใหม่ลงฐานข้อมูล: "${med.name}"`);
  } catch (e) {
    console.error('Failed to save custom med', e);
  }
};

export const getAllMeds = async (): Promise<any[]> => {
  const custom = await getCustomMeds();
  
  const builtIn = localAIFallbackDB.map(item => ({
    id: item.keywords[0],
    name: item.keywords[0].toUpperCase(),
    formalName: item.formalName,
    keywords: item.keywords,
    severity: item.severity,
    descTh: item.descTh,
    speechTh: item.speechTh,
    clashWith: item.conditions?.meds || [],
    conditions: item.conditions || {}
  }));

  return [...builtIn, ...custom];
};

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITY_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load activity logs', e);
    return [];
  }
};

export const addActivityLog = async (text: string) => {
  try {
    const logs = await getActivityLogs();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: `${dateStr} ${timeStr}`,
      text
    };
    const updated = [newLog, ...logs].slice(0, 100);
    await AsyncStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(updated));

    const storedProfile = await AsyncStorage.getItem('@user_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      if (profile.phone) {
        await syncActivityLogsWithBackend(profile.phone, updated);
      }
    }
  } catch (e) {
    console.error('Failed to add activity log', e);
  }
};

export const clearActivityLogs = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVITY_LOGS_KEY);
  } catch (e) {
    console.error(e);
  }
};
