import AsyncStorage from '@react-native-async-storage/async-storage';

export const getBackendUrl = async (): Promise<string> => {
  try {
    const customUrl = await AsyncStorage.getItem('@backend_url');
    // Ensure we strip trailing slash and use /api if not present
    let url = customUrl || 'http://localhost:5001/api';
    if (!url.endsWith('/api') && !url.includes('/api/')) {
      url = url.replace(/\/$/, '') + '/api';
    }
    return url;
  } catch {
    return 'http://localhost:5001/api';
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
