import { useState, useCallback } from 'react';

export type AlertType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'call'
  | 'water'
  | 'confirm';

export interface CustomAlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  phone?: string;
  waterCup?: number;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

const INITIAL_ALERT: CustomAlertState = {
  visible: false,
  title: '',
  message: '',
  type: 'info',
};

/**
 * useCustomAlert — จัดการ popup แจ้งเตือนแบบ Neobrutalism
 *
 * รวม logic ที่ซ้ำกันใน index/cabinet/scanner/caregiver
 * - customAlert state (รองรับทุก type: success/warning/error/info/call/water/confirm)
 * - showAlert(title, message, type, opts) — แสดง alert แบบรวบรวมในบรรทัดเดียว
 * - hideAlert() — ปิด alert (เรียก onDismiss ก่อน)
 */
export function useCustomAlert() {
  const [customAlert, setCustomAlert] = useState<CustomAlertState>(INITIAL_ALERT);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      type: AlertType = 'info',
      opts?: Partial<CustomAlertState>
    ) => {
      setCustomAlert({ visible: true, title, message, type, ...opts });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setCustomAlert(prev => {
      if (prev.onDismiss) prev.onDismiss();
      return { ...prev, visible: false };
    });
  }, []);

  // ปิด alert โดยไม่เรียก onDismiss (สำหรับกรณี onDismiss ถูกเรียกแยกใน JSX)
  const dismissVisible = useCallback(() => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  }, []);

  return { customAlert, setCustomAlert, showAlert, hideAlert, dismissVisible };
}
