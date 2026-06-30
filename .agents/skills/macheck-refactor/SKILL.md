---
name: macheck-refactor
description: |
  Refactor and reorganize the MaCheck mobile app codebase for maintainability and token efficiency.
  Use whenever the user asks to refactor, reorganize, extract, split, deduplicate, or clean up code
  in the MaCheck project. Triggers on: "refactor", "แยกไฟล์", "split file", "extract hook",
  "extract component", "ลดโค้ดซ้ำ", "deduplicate", "จัดระเบียบ", "reorganize", "cleanup",
  or when the user wants to make files smaller / more maintainable.
---

# MaCheck Refactor Guide

คู่มือการ refactor โค้ดของแอป MaCheck — แอปตรวจสอบยาสำหรับผู้สูงอายุ (Expo SDK 55 + React Native 0.83 + TypeScript)

## ปัญหาหลักของ Codebase ปัจจุบัน

- ไฟล์หน้าจอขนาด 600-1,768 บรรทัด (เกิน 300 บรรทัดที่เหมาะสม)
- โค้ด boilerplate ซ้ำกัน 4-6 ไฟล์
- Styles ซ้ำกันข้ามไฟล์
- ไม่มี shared hooks/components
- `src/api.ts` ผสมกันมากเกินไป (489 บรรทัด)

## แผน Refactoring 5 Phase (ทำตามลำดับ)

### Phase 1: แยก Shared Hooks (ไฟล์เล็ก เสี่ยงต่ำ ผลตอบแทนสูง)

ทำตามลำดับนี้ (จากที่ใช้ซ้ำมากที่สุด):

#### 1.1 `src/hooks/use-sound.ts` (~30 บรรทัด) — ใช้ใน 6 ไฟล์
```typescript
import { useState, useEffect } from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSound() {
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@sound_muted').then(value => {
      setIsSoundMuted(value === 'true');
    });
  }, []);

  const handleSpeak = (text: string) => {
    if (isSoundMuted) return;
    Speech.speak(text, { language: 'th-TH', rate: 0.9 });
  };

  const toggleSound = async (greeting = 'เปิดเสียงนำทางแล้วจ้า') => {
    const newValue = !isSoundMuted;
    setIsSoundMuted(newValue);
    await AsyncStorage.setItem('@sound_muted', newValue ? 'true' : 'false');
    if (!newValue) {
      Speech.speak(greeting, { language: 'th-TH', rate: 0.9 });
    } else {
      Speech.stop();
    }
  };

  return { isSoundMuted, handleSpeak, toggleSound };
}
```

#### 1.2 `src/hooks/use-font-size.ts` (~35 บรรทัด) — ใช้ใน 5 ไฟล์
```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useFontSize() {
  const [fontOffset, setFontOffset] = useState(0);
  const [fontSize, setFontSize] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@font_size').then(storedFontSize => {
      setFontSize(storedFontSize || 'medium');
      let offset = 0;
      if (storedFontSize === 'small') offset = -2;
      else if (storedFontSize === 'medium') offset = 3;
      else if (storedFontSize === 'large') offset = 6;
      else if (storedFontSize === 'xlarge') offset = 10;
      setFontOffset(offset);
    });
  }, []);

  const saveFontSizeSetting = async (size: string) => {
    setFontSize(size);
    let offset = 0;
    if (size === 'small') offset = -2;
    else if (size === 'medium') offset = 3;
    else if (size === 'large') offset = 6;
    else if (size === 'xlarge') offset = 10;
    setFontOffset(offset);
    await AsyncStorage.setItem('@font_size', size);
  };

  return { fontOffset, fontSize, saveFontSizeSetting };
}
```

#### 1.3 `src/hooks/use-doctor-mode.ts` (~20 บรรทัด) — ใช้ใน 4 ไฟล์
```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useDoctorMode() {
  const [doctorMode, setDoctorMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@doctor_mode').then(mode => {
      setDoctorMode(mode === 'true');
    });
  }, []);

  return { doctorMode, setDoctorMode };
}
```

#### 1.4 `src/hooks/use-custom-alert.ts` (~45 บรรทัด) — ใช้ใน 4 ไฟล์
```typescript
import { useState } from 'react';

export type AlertType = 'success' | 'warning' | 'error' | 'info' | 'call' | 'water' | 'confirm';

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

export function useCustomAlert() {
  const [customAlert, setCustomAlert] = useState<CustomAlertState>({
    visible: false, title: '', message: '', type: 'info'
  });

  const showAlert = (title: string, message: string, type: AlertType, opts?: Partial<CustomAlertState>) => {
    setCustomAlert({ visible: true, title, message, type, ...opts });
  };

  const hideAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

  return { customAlert, setCustomAlert, showAlert, hideAlert };
}
```

### Phase 2: แยก Shared Components

#### 2.1 `src/components/CustomAlertModal.tsx` (~130 บรรทัด) — ใช้ใน 4 ไฟล์

ดึง modal แจ้งเตือนออกจาก index.tsx, cabinet.tsx, scanner.tsx, caregiver.tsx

Props:
```typescript
interface Props {
  alert: CustomAlertState;
  onDismiss: () => void;
}
```

รองรับทุก type: `success`, `warning`, `error`, `info`, `call`, `water`, `confirm`

#### 2.2 `src/components/InteractionMatrix.tsx` (~200 บรรทัด) — ใช้ใน cabinet.tsx

ดึงตาราง Interaction Matrix ออกจาก cabinet.tsx (lines 566-707) + `findSeverity` function (lines 296-338)

Props:
```typescript
interface Props {
  medicines: any[];
  dbMeds: any[];
  visible: boolean;
  onClose: () => void;
  doctorMode: boolean;
  fontOffset: number;
}
```

#### 2.3 `src/components/VoiceMicModal.tsx` (~200 บรรทัด) — ใช้ใน chatbot.tsx

ดึง Voice Recognition modal ออกจาก chatbot.tsx (lines 382-477) + voice listeners

Props:
```typescript
interface Props {
  visible: boolean;
  onClose: () => void;
  onSendCommand: (text: string) => void;
  isSoundMuted: boolean;
  handleSpeak: (text: string) => void;
}
```

#### 2.4 `src/components/AlertSimulator.tsx` (~180 บรรทัด) — ใช้ใน index.tsx

ดึง Alert Simulator UI + logic ออกจาก index.tsx (lines 373-437, 598-908)

Props:
```typescript
interface Props {
  caregiverPhone: string;
  handleSpeak: (text: string) => void;
}
```

#### 2.5 `src/components/NaggingModal.tsx` (~80 บรรทัด) — ใช้ใน index.tsx

ดึง Nagging popup ออกจาก index.tsx (lines 645-672) + `NAGGING_QUESTIONS` constant

Props:
```typescript
interface Props {
  visible: boolean;
  onClose: () => void;
  onReply: (questionIndex: number, answer: string) => void;
}
```

#### 2.6 `src/components/AllergySelector.tsx` (~70 บรรทัด) — ใช้ใน register.tsx (2 ที่)

ดึง allergy card grid ออกจาก register.tsx (ซ้ำกันใน settings tab และ register tab)

Props:
```typescript
interface Props {
  allergies: any[];
  onToggleAllergy: (drugName: string) => void;
  onSetSeverity: (drugName: string, severity: 'green' | 'yellow' | 'red') => void;
  doctorMode: boolean;
  fontOffset: number;
}
```

### Phase 3: แยก Utilities และ Constants

#### 3.1 `src/utils/constants.ts` (~80 บรรทัด)
รวม data constants ที่กระจัดกระจาย:
- `DISEASES_LIST` (จาก register.tsx lines 9-17)
- `ALLERGIES_LIST` (จาก register.tsx lines 24-33)
- `ALLERGY_DRUG_KEYWORDS` (จาก api.ts lines 244-253)
- `QUICK_VOICE_COMMANDS` (จาก chatbot.tsx lines 17-23)
- `NAGGING_QUESTIONS` (จาก index.tsx lines 20-48)
- `getDiseaseThName()` (จาก caregiver.tsx lines 271-282)

#### 3.2 `src/utils/format.ts` (~35 บรรทัด)
รวม pure utility functions:
- `formatDuration()` (จาก index.tsx lines 439-444)
- `formatBirthdate()` (จาก register.tsx lines 61-84)

### Phase 4: แยก Styles

#### 4.1 `src/styles/common.ts` (~80 บรรทัด)
รวม styles ที่ซ้ำกันข้ามไฟล์:
- `alertModalBg`, `alertCard`, `alertHeaderBadge`, `alertTitle`, `alertMessage`, `alertBtn`, `alertBtnText`
- `confirmBtnRow`, `confirmBtn`, `btnCancel`, `btnCancelText`, `btnConfirm`, `btnConfirmText`

#### 4.2 Styles แยกตามหน้าจอ
แต่ละไฟล์หน้าจอยังคงมี styles เฉพาะของตัวเอง แต่อยู่ในไฟล์แยก:
- `src/styles/index.styles.ts` (~450 บรรทัด)
- `src/styles/cabinet.styles.ts` (~350 บรรทัด)
- `src/styles/scanner.styles.ts` (~430 บรรทัด)
- `src/styles/caregiver.styles.ts` (~260 บรรทัด)
- `src/styles/register.styles.ts` (~360 บรรทัด)
- `src/styles/chatbot.styles.ts` (~170 บรรทัด)

ใช้วิธี: `import { styles } from '@/styles/<name>.styles';` ในแต่ละหน้าจอ

### Phase 5: แยก API Module

แยก `src/api.ts` (489 บรรทัด) เป็น 5 ไฟล์ย่อย:

```
src/api/
├── index.ts              (barrel re-export, ~6 บรรทัด)
├── backend-sync.ts       (getBackendUrl, checkBackendOnline, sync functions, ~100 บรรทัด)
├── medications.ts        (getCustomMeds, saveCustomMed, getAllMeds, mockExtract, ~90 บรรทัด)
├── activity-logs.ts      (ActivityLog interface, CRUD functions, ~50 บรรทัด)
├── interaction-check.ts  (checkInteraction — 153 บรรทัดเดี่ยว, ~160 บรรทัด)
└── caregiver-remote.ts   (getRemoteProfile, getRemoteCabinet, sendRemoteNudge, ~90 บรรทัด)
```

Barrel `src/api/index.ts`:
```typescript
export * from './backend-sync';
export * from './medications';
export * from './activity-logs';
export * from './interaction-check';
export * from './caregiver-remote';
```

เพื่อให้ import path เดิม `from '@/api'` ยังใช้ได้เหมือนเดิม

## ผลลัพธ์ที่คาดหวังหลัง Refactor

| ไฟล์ | ก่อน (บรรทัด) | หลัง (บรรทัด) | ลดลง |
|---|---|---|---|
| `src/app/index.tsx` | 1,768 | ~800 | **55%** |
| `src/app/cabinet.tsx` | 1,091 | ~500 | **54%** |
| `src/app/scanner.tsx` | 1,142 | ~600 | **47%** |
| `src/app/caregiver.tsx` | 1,042 | ~550 | **47%** |
| `src/app/register.tsx` | 1,312 | ~700 | **46%** |
| `src/app/chatbot.tsx` | 649 | ~350 | **46%** |
| `src/api.ts` → `src/api/` | 489 | 6 (barrel) | **99%** |

## กฎการ Refactor

1. **ทำ Phase 1 ก่อนเสมอ** — hooks เป็นรากฐานที่ components อื่นจะใช้
2. **ย้ายแล้วต้องอัปเดท import ในไฟล์ต้นทาง** — ลบโค้ดเก่าออก และ import จาก shared module ใหม่
3. **อย่าเปลี่ยน behavior** — refactor ต้องไม่เปลี่ยนผลลัพธ์ที่ผู้ใช้เห็น
4. **เก็บบาร์เรล re-export** — ทุก module ที่แยกออกจาก `api.ts` ต้อง re-export ผ่าน `src/api/index.ts` เพื่อไม่ให้ import path พัง
5. **ทดสอบแต่ละ Phase** — รันแอปหลังทำแต่ละ phase ให้แน่ใจว่าไม่มี error
6. **คอมมิทแต่ละ Phase** — สร้าง git commit แยกกันเพื่อ rollback ได้ง่าย
