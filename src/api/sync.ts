import { checkBackendOnline, getBackendUrl } from './client';
import { ActivityLog } from './storage';

type SyncedCabinetMed = {
  id: string;
  name: string;
  medId: string;
};

export const syncProfileWithBackend = async (profile: any) => {
  try {
    const online = await checkBackendOnline();
    if (!online) return;

    const url = await getBackendUrl();
    await fetch(`${url}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: profile.phone,
        name: profile.name,
        birthdate: profile.birthdate,
        diseases: profile.diseases || [],
        caregiver_phone: profile.caregiver_phone || '',
        doctor_mode: profile.doctor_mode || false,
        font_size: profile.font_size || 'normal',
        allergies: profile.allergies || [],
        syncCode: profile.syncCode
      })
    });
  } catch (e) {
    console.error('[syncProfileWithBackend Error]', e);
  }
};

export const syncCabinetWithBackend = async (phone: string, localMeds: any[]) => {
  try {
    const online = await checkBackendOnline();
    if (!online) return;

    const url = await getBackendUrl();
    const res = await fetch(`${url}/cabinet/${phone}`);
    if (res.ok) {
      const normalizeMed = (med: any, index = 0): SyncedCabinetMed | null => {
        const name = med.name || med.med_name;
        const medId = med.medId || med.med_id || name;
        const id = med.id || medId || `${Date.now()}_${index}`;
        return name ? { id: String(id), name, medId } : null;
      };
      const isSyncedCabinetMed = (med: SyncedCabinetMed | null): med is SyncedCabinetMed => med !== null;
      const remoteMeds = (await res.json()).map(normalizeMed).filter(isSyncedCabinetMed);
      const normalizedLocal = localMeds.map(normalizeMed).filter(isSyncedCabinetMed);

      for (const remote of remoteMeds) {
        if (!normalizedLocal.some((m: any) => m.id === remote.id)) {
          await fetch(`${url}/cabinet/${phone}/${remote.id}`, { method: 'DELETE' });
        }
      }
      for (const local of normalizedLocal) {
        if (!remoteMeds.some((m: any) => m.id === local.id)) {
          await fetch(`${url}/cabinet/${phone}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: local.id, name: local.name, medId: local.medId })
          });
        }
      }
    }
  } catch (e) {
    console.error('[syncCabinetWithBackend Error]', e);
  }
};

export const syncActivityLogsWithBackend = async (phone: string, localLogs: any[]) => {
  try {
    const online = await checkBackendOnline();
    if (!online) return;

    const url = await getBackendUrl();
    const res = await fetch(`${url}/logs/${phone}`);
    if (res.ok) {
      const remoteLogs = await res.json();
      for (const local of localLogs) {
        if (!remoteLogs.some((l: any) => l.id === local.id)) {
          await fetch(`${url}/logs/${phone}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: local.id, text: local.text, timestamp: local.timestamp })
          });
        }
      }
    }
  } catch (e) {
    console.error('[syncActivityLogsWithBackend Error]', e);
  }
};

export const getRemoteProfile = async (phone: string): Promise<any | null> => {
  try {
    const url = await getBackendUrl();
    const res = await fetch(`${url}/profiles/${phone}`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (e) {
    console.error('getRemoteProfile failed', e);
    return null;
  }
};

export const getRemoteCabinet = async (phone: string): Promise<any[]> => {
  try {
    const url = await getBackendUrl();
    const res = await fetch(`${url}/cabinet/${phone}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        id: item.id || Date.now().toString(),
        name: item.name || item.med_name,
        medId: item.med_id || item.medId || item.name || item.med_name
      })).filter((item: any) => item.name);
    }
    return [];
  } catch (e) {
    console.error('getRemoteCabinet failed', e);
    return [];
  }
};

export const getRemoteLogs = async (phone: string): Promise<ActivityLog[]> => {
  try {
    const url = await getBackendUrl();
    const res = await fetch(`${url}/logs/${phone}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        id: item.id || Date.now().toString(),
        timestamp: item.timestamp || '',
        text: item.text || item.log_text || ''
      })).filter((item: ActivityLog) => item.text);
    }
    return [];
  } catch (e) {
    console.error('getRemoteLogs failed', e);
    return [];
  }
};

export const sendRemoteNudge = async (phone: string, type: string, text: string): Promise<boolean> => {
  try {
    const url = await getBackendUrl();
    const res = await fetch(`${url}/caregiver/nudge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, type, text })
    });
    return res.ok;
  } catch (e) {
    console.error('sendRemoteNudge failed', e);
    return false;
  }
};

export const clearRemoteNudge = async (phone: string): Promise<boolean> => {
  try {
    const url = await getBackendUrl();
    const res = await fetch(`${url}/caregiver/clear-nudge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return res.ok;
  } catch (e) {
    console.error('clearRemoteNudge failed', e);
    return false;
  }
};
