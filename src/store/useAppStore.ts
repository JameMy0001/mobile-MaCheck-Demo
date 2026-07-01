import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rescheduleAllCabinetMeds } from '../services/notificationService';

export interface UserProfile {
  name: string;
  phone: string;
  birthdate: string;
  diseases: string[];
  allergies: Array<{ medId: string; severity: 'mild' | 'severe' | 'moderate' }>;
  otherDiseases?: string;
  otherAllergies?: string;
  syncCode?: string;
}

export interface CabinetMed {
  id: string;
  name: string;
  dosage?: string;
  time?: string;
  speechText?: string;
  isHighRisk?: boolean;
  suspended?: boolean;
  suspendedBy?: string;
  suspendedReason?: string;
  medId?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  text: string;
}

export interface ActiveChallenge {
  medName: string;
  timeLeft: number;
  maxTime: number;
  waterCups: number;
}

export interface AppState {
  profile: UserProfile | null;
  allUsers: UserProfile[];
  cabinet: CabinetMed[];
  logs: ActivityLog[];
  activeChallenge: ActiveChallenge | null;
  doctorMode: boolean;
  developerMode: boolean;
  fontSize: 'small' | 'normal' | 'medium' | 'large' | 'xlarge';
  soundMuted: boolean;
  caregiverPhone: string;
  geminiApiKey: string;
  backendUrl: string;
  isLoaded: boolean;

  setProfile: (profile: UserProfile | null) => Promise<void>;
  setCabinet: (cabinet: CabinetMed[]) => Promise<void>;
  setLogs: (logs: ActivityLog[]) => Promise<void>;
  addLog: (action: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  setActiveChallenge: (challenge: ActiveChallenge | null) => Promise<void>;
  setDoctorMode: (mode: boolean) => Promise<void>;
  setDeveloperMode: (mode: boolean) => Promise<void>;
  setFontSize: (size: 'small' | 'normal' | 'medium' | 'large' | 'xlarge') => Promise<void>;
  setSoundMuted: (muted: boolean) => Promise<void>;
  setCaregiverPhone: (phone: string) => Promise<void>;
  setGeminiApiKey: (key: string) => Promise<void>;
  setBackendUrl: (url: string) => Promise<void>;
  loadAllFromStorage: () => Promise<void>;
  refreshAllUsers: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  allUsers: [],
  cabinet: [],
  logs: [],
  activeChallenge: null,
  doctorMode: false,
  developerMode: false,
  fontSize: 'normal',
  soundMuted: false,
  caregiverPhone: '',
  geminiApiKey: '',
  backendUrl: 'http://localhost:3000',
  isLoaded: false,

  setProfile: async (profile) => {
    set({ profile });
    if (profile) {
      await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
      const { allUsers } = get();
      const updatedUsers = allUsers.filter(u => u.phone !== profile.phone);
      updatedUsers.unshift(profile);
      set({ allUsers: updatedUsers });
      await AsyncStorage.setItem('@all_users', JSON.stringify(updatedUsers));
    } else {
      await AsyncStorage.removeItem('@user_profile');
    }
  },

  setCabinet: async (cabinet) => {
    set({ cabinet });
    await AsyncStorage.setItem('@cabinet_meds', JSON.stringify(cabinet));
    await rescheduleAllCabinetMeds(cabinet).catch(err => console.error('Notifications reschedule error:', err));
  },

  setLogs: async (logs) => {
    set({ logs });
    await AsyncStorage.setItem('@activity_logs', JSON.stringify(logs));
  },

  addLog: async (action) => {
    const { logs } = get();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const newLog = {
      id: Math.random().toString(),
      timestamp: `${dateStr} ${timeStr}`,
      text: action
    };
    const updated = [newLog, ...logs].slice(0, 100);
    set({ logs: updated });
    await AsyncStorage.setItem('@activity_logs', JSON.stringify(updated));
  },

  clearLogs: async () => {
    set({ logs: [] });
    await AsyncStorage.removeItem('@activity_logs');
  },

  setActiveChallenge: async (activeChallenge) => {
    set({ activeChallenge });
    if (activeChallenge) {
      await AsyncStorage.setItem('@active_challenge', JSON.stringify(activeChallenge));
    } else {
      await AsyncStorage.removeItem('@active_challenge');
    }
  },

  setDoctorMode: async (doctorMode) => {
    set({ doctorMode });
    await AsyncStorage.setItem('@doctor_mode', doctorMode ? 'true' : 'false');
  },

  setDeveloperMode: async (developerMode) => {
    set({ developerMode });
    await AsyncStorage.setItem('@developer_mode', developerMode ? 'true' : 'false');
  },

  setFontSize: async (fontSize) => {
    set({ fontSize });
    await AsyncStorage.setItem('@font_size', fontSize);
  },

  setSoundMuted: async (soundMuted) => {
    set({ soundMuted });
    await AsyncStorage.setItem('@sound_muted', soundMuted ? 'true' : 'false');
  },

  setCaregiverPhone: async (caregiverPhone) => {
    set({ caregiverPhone });
    await AsyncStorage.setItem('@caregiver_phone', caregiverPhone);
  },

  setGeminiApiKey: async (geminiApiKey) => {
    set({ geminiApiKey });
    await AsyncStorage.setItem('@gemini_api_key', geminiApiKey);
  },

  setBackendUrl: async (backendUrl) => {
    set({ backendUrl });
    await AsyncStorage.setItem('@backend_url', backendUrl);
  },

  loadAllFromStorage: async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('@user_profile');
      const storedCabinet = await AsyncStorage.getItem('@cabinet_meds');
      const storedLogs = await AsyncStorage.getItem('@activity_logs');
      const storedChallenge = await AsyncStorage.getItem('@active_challenge');
      const storedDoctorMode = await AsyncStorage.getItem('@doctor_mode');
      const storedFontSize = await AsyncStorage.getItem('@font_size');
      const storedSoundMuted = await AsyncStorage.getItem('@sound_muted');
      const storedCgPhone = await AsyncStorage.getItem('@caregiver_phone');
      const storedGeminiKey = await AsyncStorage.getItem('@gemini_api_key');
      const storedBackendUrl = await AsyncStorage.getItem('@backend_url');
      const storedAllUsers = await AsyncStorage.getItem('@all_users');

      const storedDevMode = await AsyncStorage.getItem('@developer_mode');

      set({
        profile: storedProfile ? JSON.parse(storedProfile) : null,
        cabinet: storedCabinet ? JSON.parse(storedCabinet) : [],
        logs: storedLogs ? JSON.parse(storedLogs) : [],
        activeChallenge: storedChallenge ? JSON.parse(storedChallenge) : null,
        doctorMode: storedDoctorMode === 'true',
        developerMode: storedDevMode === 'true',
        fontSize: (storedFontSize as any) || 'normal',
        soundMuted: storedSoundMuted === 'true',
        caregiverPhone: storedCgPhone || '',
        geminiApiKey: storedGeminiKey || '',
        backendUrl: storedBackendUrl || 'http://localhost:3000',
        allUsers: storedAllUsers ? JSON.parse(storedAllUsers) : [],
        isLoaded: true
      });
    } catch (e) {
      console.error('Error loading Zustand store:', e);
    }
  },

  refreshAllUsers: async () => {
    const storedAllUsers = await AsyncStorage.getItem('@all_users');
    set({ allUsers: storedAllUsers ? JSON.parse(storedAllUsers) : [] });
  }
}));
