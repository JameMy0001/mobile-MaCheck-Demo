import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const DEFAULT_BACKEND_URL =
  (Constants.expoConfig?.extra?.backendUrl as string | undefined) || 'http://localhost:5001/api';

export const normalizeBackendUrl = (url?: string | null): string => {
  const trimmed = url?.trim();
  const shouldUseDefault =
    !trimmed ||
    (!__DEV__ && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed));

  let normalized = shouldUseDefault ? DEFAULT_BACKEND_URL : trimmed;
  if (!normalized.endsWith('/api') && !normalized.includes('/api/')) {
    normalized = normalized.replace(/\/$/, '') + '/api';
  }
  return normalized;
};

export const getBackendUrl = async (): Promise<string> => {
  try {
    const customUrl = await AsyncStorage.getItem('@backend_url');
    return normalizeBackendUrl(customUrl);
  } catch {
    return DEFAULT_BACKEND_URL;
  }
};

export const checkBackendOnline = async (): Promise<boolean> => {
  try {
    const url = await getBackendUrl();
    const res = await fetch(`${url}/status`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'online';
    }
    return false;
  } catch {
    return false;
  }
};
