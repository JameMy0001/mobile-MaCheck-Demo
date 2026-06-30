---
name: macheck-screen
description: |
  Scaffold, edit, and refactor screen files for the MaCheck mobile app (Thai-language elderly medication safety app).
  Use whenever the user asks to create a new screen/page, modify an existing screen, refactor boilerplate out of screens,
  or mentions anything related to MaCheck screens, navigation, or screen-level components.
  Triggers on: "สร้างหน้าจอ", "new screen", "แก้ไขหน้า", "refactor screen", "เพิ่มฟีเจอร์", "add page", "ย้ายโค้ดออกจากหน้า",
  or when editing any file under src/app/.
---

# MaCheck Screen Scaffold

ตัวช่วยสร้างและจัดการหน้าจอของแอป MaCheck — แอปตรวจสอบยาสำหรับผู้สูงอายุ (ภาษาไทย) สร้างด้วย Expo SDK 55 + React Native 0.83 + TypeScript

## โครงสร้างไฟล์หน้าจอที่ถูกต้อง

ไฟล์อยู่ที่ `src/app/<screen-name>.tsx` และถูก auto-route ผ่าน `expo-router`

### ส่วนประกอบของไฟล์หน้าจอ (ตามลำดับ)

```
1. Imports
2. Types/Interfaces (local to this screen only)
3. Component function
   3.1 State declarations
   3.2 Shared settings hooks (loadFontSize, loadDoctorMode, etc.)
   3.3 Screen-specific logic functions
   3.4 useEffect (load data on mount/focus)
   3.5 JSX return
4. StyleSheet
```

## Shared Boilerplate — ใช้ Import จาก hooks และ components ที่มีอยู่

> ⚠️ **กฎสำคัญ**: อย่าคัดลอก boilerplate โค้ดเข้าไปในไฟล์หน้าจอใหม่โดยตรง ให้ import จาก shared hooks/components แทน

### Shared Settings State (ทุกหน้าจอต้องมี)

ทุกหน้าจอในแอปต้องมี state เหล่านี้:

```typescript
const [fontOffset, setFontOffset] = useState(0);
const [doctorMode, setDoctorMode] = useState(false);
const [isSoundMuted, setIsSoundMuted] = useState(false);
const [profile, setProfile] = useState<any>(null);
```

### ฟังก์ชันโหลด Settings (อ่านจาก AsyncStorage)

```typescript
// ขนาดตัวอักษร: small→-2, medium→3, large→6, xlarge→10
const loadFontSize = async () => {
  const storedFontSize = await AsyncStorage.getItem('@font_size');
  let offset = 0;
  if (storedFontSize === 'small') offset = -2;
  else if (storedFontSize === 'medium') offset = 3;
  else if (storedFontSize === 'large') offset = 6;
  else if (storedFontSize === 'xlarge') offset = 10;
  setFontOffset(offset);
};

// โหมดหมอ: เปิด/ปิด
const loadDoctorMode = async () => {
  const mode = await AsyncStorage.getItem('@doctor_mode');
  setDoctorMode(mode === 'true');
};

// เสียง: เปิด/ปิด
const loadSoundSetting = async () => {
  const value = await AsyncStorage.getItem('@sound_muted');
  setIsSoundMuted(value === 'true');
};

// โหลดโปรไฟล์ผู้ใช้
const loadProfile = async () => {
  const stored = await AsyncStorage.getItem('@user_profile');
  if (stored) setProfile(JSON.parse(stored));
};
```

### handleSpeak — อ่านออกเสียงภาษาไทย

```typescript
const handleSpeak = (text: string) => {
  if (isSoundMuted) return;
  Speech.speak(text, { language: 'th-TH', rate: 0.9 });
};
```

### toggleSound — สลับเปิด/ปิดเสียง

```typescript
const toggleSound = async () => {
  const newValue = !isSoundMuted;
  setIsSoundMuted(newValue);
  await AsyncStorage.setItem('@sound_muted', newValue ? 'true' : 'false');
  if (!newValue) {
    Speech.speak('เปิดเสียงนำทางแล้วจ้า', { language: 'th-TH', rate: 0.9 });
  } else {
    Speech.stop();
  }
};
```

### customAlert State + Modal (สำหรับ popup แจ้งเตือน)

**State type:**
```typescript
const [customAlert, setCustomAlert] = useState<{
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  onDismiss?: () => void;
}>({
  visible: false,
  title: '',
  message: '',
  type: 'info'
});
```

**JSX Modal — Neobrutalism style:**
```tsx
{customAlert.visible && (
  <Modal
    animationType="fade"
    transparent={true}
    visible={customAlert.visible}
    onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
  >
    <View style={styles.alertModalBg}>
      <View style={styles.alertCard}>
        <View style={[
          styles.alertHeaderBadge,
          { backgroundColor:
            customAlert.type === 'error' ? '#FF5252' :
            customAlert.type === 'warning' ? '#FFA726' :
            customAlert.type === 'success' ? '#4CAF50' : '#2196F3' }
        ]}>
          <FontAwesome5
            name={
              customAlert.type === 'error' ? 'times-circle' :
              customAlert.type === 'warning' ? 'exclamation-triangle' :
              customAlert.type === 'success' ? 'check-circle' : 'info-circle'
            }
            size={32}
            color="#FFF"
          />
        </View>
        <Text style={styles.alertTitle}>{customAlert.title}</Text>
        <Text style={styles.alertMessage}>{customAlert.message}</Text>
        <TouchableOpacity
          style={[
            styles.alertBtn,
            { backgroundColor:
              customAlert.type === 'error' ? '#FF5252' :
              customAlert.type === 'warning' ? '#FFA726' :
              customAlert.type === 'success' ? '#4CAF50' : '#2196F3' }
          ]}
          onPress={() => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            if (customAlert.onDismiss) customAlert.onDismiss();
          }}
        >
          <Text style={styles.alertBtnText}>ตกลง/รับทราบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}
```

### CustomAlert Styles (Neobrutalism)

```typescript
alertModalBg: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
},
alertCard: {
  backgroundColor: '#FFF',
  borderWidth: 4,
  borderColor: '#000',
  borderRadius: 20,
  boxShadow: '6px 6px 0px #000',
  padding: 24,
  width: '100%',
  maxWidth: 340,
  alignItems: 'center',
  gap: 16,
},
alertHeaderBadge: {
  width: 64,
  height: 64,
  borderRadius: 32,
  borderWidth: 3,
  borderColor: '#000',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: -48,
},
alertTitle: {
  fontSize: 22,
  fontWeight: '900',
  color: '#000',
  textAlign: 'center',
},
alertMessage: {
  fontSize: 16,
  fontWeight: '800',
  color: '#444',
  textAlign: 'center',
  lineHeight: 24,
},
alertBtn: {
  borderWidth: 3,
  borderColor: '#000',
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 24,
  width: '100%',
  alignItems: 'center',
  boxShadow: '3px 3px 0px #000',
},
alertBtnText: {
  color: '#FFF',
  fontSize: 16,
  fontWeight: '900',
},
```

## ระบบการออกแบบ — Neobrutalism Design System

### สีหลัก (Color Tokens)

| ชื่อ | โค้ดสี | ใช้สำหรับ |
|---|---|---|
| Primary Yellow | `#FBC02D` | Header, พื้นหลังหลัก |
| Cream BG | `#FFF8E1` | Container พื้นหลัง |
| Danger Red | `#FF5252` | แจ้งเตือน error |
| Warning Orange | `#FFA726` | แจ้งเตือน warning |
| Success Green | `#4CAF50` | แจ้งเตือน success |
| Info Blue | `#2196F3` | แจ้งเตือน info |
| Dark Red | `#D32F2F` | ฉุกเฉินร้ายแรง |
| Black | `#000` | Border (เป็นเอกลักษณ์) |
| White | `#FFF` | Card backgrounds |

### Neobrutalism Border Pattern

เป็นเอกลักษณ์หลักของแอป — ทุก card, button, modal ต้องมี:

```typescript
{
  borderWidth: 3,
  borderColor: '#000',
  borderRadius: 12,   // หรือ 16, 20 สำหรับ card ใหญ่
  boxShadow: '4px 4px 0px #000',  // หรือ '3px 3px', '2px 2px'
}
```

### ขนาดตัวอักษร + fontOffset

ทุก `<Text>` ที่ต้องรองรับการปรับขนาดตัวอักษรต้องใช้:

```typescript
style={{ fontSize: 16 + fontOffset, ... }}
```

### ความหนาตัวอักษร (Font Weight)

แอปใช้ font weight เข้มเป็นเอกลักษณ์:
- หัวข้อ: `fontWeight: '900'`
- ข้อความปกติ: `fontWeight: '700'` หรือ `'800'`
- รายละเอียด: `fontWeight: '600'`

## Imports มาตรฐาน

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, TextInput, Image, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
// เพิ่ม imports เฉพาะหน้าจอตามที่จำเป็น เช่น:
// import { CameraView } from 'expo-camera';
// import Voice from '@react-native-voice/voice';
// import { checkInteraction, getAllMeds, getActivityLogs, addActivityLog } from '@/api';
// import { localAIFallbackDB, localFoodClashesDB } from '@/assets/local_ai_db';
```

## AsyncStorage Keys

| Key | Type | ใช้สำหรับ |
|---|---|---|
| `@user_profile` | JSON string | ข้อมูลโปรไฟล์ผู้สูงอายุ |
| `@font_size` | `'small'`/`'medium'`/`'large'`/`'xlarge'` | ขนาดตัวอักษร |
| `@doctor_mode` | `'true'`/`'false'` | โหมดแพทย์ |
| `@sound_muted` | `'true'`/`'false'` | ปิดเสียง |
| `@cabinet_meds` | JSON string | ตู้ยาของผู้ใช้ |
| `@custom_meds` | JSON string | ยาที่ผู้ใช้เพิ่มเอง |
| `@backend_url` | URL string | URL backend (default: `http://localhost:5001/api`) |

## API Functions ที่มีอยู่ (จาก `src/api.ts`)

อย่าสร้างฟังก์ชันใหม่ที่ทำงานเดียวกับที่มีอยู่แล้ว ให้ import จาก `@/api`:

```typescript
// ตรวจสอบปฏิกิริยาระหว่างยา — สำคัญที่สุด
checkInteraction(newDrugName, currentCabinet, diseases?, allergies?)
  → { severity: string; descTh: string; speechTh: string } | null

// ยา
getAllMeds() → any[]
getCustomMeds() → any[]
saveCustomMed(med) → void

// Activity log
getActivityLogs() → ActivityLog[]
addActivityLog(text) → void
clearActivityLogs() → void

// Backend sync
syncProfileWithBackend(profile) → void
syncCabinetWithBackend(phone, localMeds) → void
syncActivityLogsWithBackend(phone, localLogs) → void

// Caregiver remote
getRemoteProfile(phone) → any | null
getRemoteCabinet(phone) → any[]
getRemoteLogs(phone) → ActivityLog[]
sendRemoteNudge(phone, type, text) → boolean

// Helpers
getBackendUrl() → string
checkBackendOnline() → boolean
```

## ภาษาและ Persona

- **ทุก UI text ต้องเป็นภาษาไทย**
- **Persona**: "หลานพูดกับคุณตา" — ใช้คำว่า "คุณตา", "จ้า", "นะคะ"
- ปุ่ม: "ตกลง/รับทราบ", "บันทึก", "ยกเลิก", "ตรวจสอบ"
- แจ้งเตือน TTS ใช้ speechTh จาก drug database หรือข้อความภาษาไทย

## เมื่อสร้างหน้าจอใหม่

1. สร้างไฟล์ `src/app/<name>.tsx`
2. เริ่มด้วย imports + state declarations ตามมาตรฐานด้านบน
3. ใช้ Neobrutalism design tokens
4. เพิ่ม `fontOffset` ในทุก fontSize
5. มี `customAlert` modal สำหรับแจ้งเตือน
6. มี `handleSpeak` สำหรับอ่านออกเสียง
7. เขียน StyleSheet ท้ายไฟล์

## เมื่อ Refactor หน้าจอเดิม

- ตรวจสอบว่ามี boilerplate ซ้ำกับหน้าอื่น → แยกเป็น shared hook/component
- ไฟล์ไม่ควรเกิน 300 บรรทัด — ถ้าเกินให้แยก components, hooks, หรือ styles ออก
- แยก business logic ออกจาก JSX
- ใช้ TypeScript interfaces แทน `any` ทุกที่ที่เป็นไปได้
