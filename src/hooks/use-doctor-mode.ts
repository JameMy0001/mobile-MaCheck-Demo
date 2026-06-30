import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useDoctorMode() {
  const doctorMode = useAppStore((state) => state.doctorMode);
  const setDoctorMode = useAppStore((state) => state.setDoctorMode);

  const loadDoctorMode = useCallback(async () => {
    // No-op for backward compatibility
  }, []);

  return { doctorMode, setDoctorMode, loadDoctorMode };
}
