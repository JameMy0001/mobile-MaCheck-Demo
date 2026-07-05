import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { addActivityLog, syncProfileWithBackend, checkBackendOnline } from '../api';
import { useSound } from '@/hooks/use-sound';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useAppStore } from '../store/useAppStore';
import { SeniorColors } from '@/constants/senior-theme';
import { useTranslation } from '../constants/translations';

const DISEASES_LIST = [
  { id: 'hypertension', name: 'ความดันโลหิตสูง', icon: 'heartbeat', color: '#E91E63' },
  { id: 'diabetes', name: 'โรคเบาหวาน', icon: 'tint', color: '#FF5722' },
  { id: 'heart', name: 'โรคหัวใจ', icon: 'heart', color: '#F44336' },
  { id: 'lipid', name: 'ไขมันในเลือดสูง', icon: 'chart-pie', color: '#9C27B0' },
  { id: 'kidney', name: 'โรคไต', icon: 'capsules', color: '#3F51B5' },
  { id: 'stomach', name: 'โรคกระเพาะอาหาร', icon: 'hamburger', color: '#FF9800' },
  { id: 'liver', name: 'โรคตับ', icon: 'shield-alt', color: '#4CAF50' },
];

interface AllergyEntry {
  medId: string;
  severity: 'severe' | 'moderate' | 'mild';
}

const ALLERGIES_LIST = [
  { id: 'aspirin', name: 'ยาแอสไพริน (Aspirin)', color: '#FFEBEE' },
  { id: 'ibuprofen', name: 'ยาแก้ปวดข้อ (Ibuprofen)', color: '#ECEFF1' },
  { id: 'simvastatin', name: 'ยาลดไขมัน (Simvastatin)', color: '#FFF3E0' },
  { id: 'warfarin', name: 'ยาต้านการแข็งตัวของเลือด (Warfarin)', color: '#E8F5E9' },
  { id: 'metformin', name: 'ยาโรคเบาหวาน (Metformin)', color: '#E0F2F1' },
  { id: 'amlodipine', name: 'ยาลดความดัน (Amlodipine)', color: '#E0F7FA' },
  { id: 'lisinopril', name: 'ยาลดความดัน (Lisinopril)', color: '#E8EAF6' },
  { id: 'digoxin', name: 'ยาโรคหัวใจ (Digoxin)', color: '#F3E5F5' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'register' | 'login'>('register');
  
  const storeProfile = useAppStore((state) => state.profile);
  const allUsers = useAppStore((state) => state.allUsers);
  const storeCaregiverPhone = useAppStore((state) => state.caregiverPhone);
  const storeBackendUrl = useAppStore((state) => state.backendUrl);
  const storeDevMode = useAppStore((state) => state.developerMode);
  const refreshAllUsers = useAppStore((state) => state.refreshAllUsers);
  
  const { t, language } = useTranslation();
  const setLanguage = useAppStore((state) => state.setLanguage);

  // Register fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<AllergyEntry[]>([]);
  const [otherDiseases, setOtherDiseases] = useState('');
  const [otherAllergies, setOtherAllergies] = useState('');
  
  // Settings fields
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const { doctorMode, setDoctorMode } = useDoctorMode();
  const [developerMode, setDeveloperMode] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginBirthdate, setLoginBirthdate] = useState('');
  
  const [hasProfile, setHasProfile] = useState(false);

  const formatBirthdate = (text: string, prevText: string) => {
    const isDeletion = text.length < prevText.length;
    let clean = text.replace(/\D/g, ''); // Remove non-digits
    if (clean.length > 8) {
      clean = clean.substring(0, 8);
    }
    let formatted = '';
    if (clean.length > 0) {
      formatted += clean.substring(0, 2);
      if (clean.length === 2 && !isDeletion) {
        formatted += '/';
      }
    }
    if (clean.length > 2) {
      formatted = clean.substring(0, 2) + '/' + clean.substring(2, 4);
      if (clean.length === 4 && !isDeletion) {
        formatted += '/';
      }
    }
    if (clean.length > 4) {
      formatted = clean.substring(0, 2) + '/' + clean.substring(2, 4) + '/' + clean.substring(4, 8);
    }
    return formatted;
  };

  // Font Size (shared hook)
  const { fontOffset, fontSize, loadFontSize, saveFontSizeSetting } = useFontSize();
  const { handleSpeak } = useSound();

  useEffect(() => {
    checkProfileAndUsers();
    loadFontSize();
    handleSpeak('เข้าสู่หน้าจอจัดการผู้ป่วยค่ะ คุณตาสามารถลงทะเบียนใหม่ หรือแตะสลับเพื่อเข้าสู่ระบบผู้ป่วยเดิมได้นะคะ');
  }, []);

  const saveFontSizeWithSpeech = async (size: string) => {
    try {
      await saveFontSizeSetting(size as any);
      
      let speechText = 'ปรับขนาดตัวอักษรแล้วค่ะ';
      if (size === 'small') speechText = 'ปรับขนาดตัวอักษรเป็นระดับ เล็ก แล้วค่ะ';
      else if (size === 'normal') speechText = 'ปรับขนาดตัวอักษรเป็นระดับ ปกติ แล้วค่ะ';
      else if (size === 'medium') speechText = 'ปรับขนาดตัวอักษรเป็นระดับ กลาง แล้วค่ะ';
      else if (size === 'large') speechText = 'ปรับขนาดตัวอักษรเป็นระดับ ใหญ่ แล้วค่ะ';
      else if (size === 'xlarge') speechText = 'ปรับขนาดตัวอักษรเป็นระดับ ใหญ่มาก แล้วค่ะ';
      
      handleSpeak(speechText);
    } catch (e) {
      console.error(e);
    }
  };

  const checkProfileAndUsers = async () => {
    try {
      await refreshAllUsers();
      if (storeCaregiverPhone) setCaregiverPhone(storeCaregiverPhone);
      setBackendUrl(storeBackendUrl || 'http://localhost:5001/api');
      setDeveloperMode(storeDevMode);

      if (storeProfile) {
        setHasProfile(true);
        setActiveTab('settings');
        setName(storeProfile.name || '');
        setPhone(storeProfile.phone || '');
        setBirthdate(storeProfile.birthdate || '');
        setSelectedDiseases(storeProfile.diseases || []);
        setAllergies(storeProfile.allergies || []);
        setOtherDiseases(storeProfile.otherDiseases || '');
        setOtherAllergies(storeProfile.otherAllergies || '');
      } else {
        setHasProfile(false);
        setActiveTab('register');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDisease = (id: string, nameTh: string) => {
    if (selectedDiseases.includes(id)) {
      setSelectedDiseases(selectedDiseases.filter(d => d !== id));
      handleSpeak(`เอาออก ${nameTh} ค่ะ`);
    } else {
      setSelectedDiseases([...selectedDiseases, id]);
      handleSpeak(`เลือก ${nameTh} ค่ะ`);
    }
  };

  const toggleAllergy = (medId: string) => {
    const existingIndex = allergies.findIndex(a => a.medId === medId);
    let newAllergies = [...allergies];
    if (existingIndex > -1) {
      newAllergies.splice(existingIndex, 1);
      const nameTh = ALLERGIES_LIST.find(item => item.id === medId)?.name || medId;
      handleSpeak(`ยกเลิกเลือกประวัติแพ้ยา ${nameTh.split(' (')[0]} ค่ะ`);
    } else {
      newAllergies.push({ medId: medId, severity: 'severe' });
      const nameTh = ALLERGIES_LIST.find(item => item.id === medId)?.name || medId;
      handleSpeak(`เพิ่มประวัติแพ้ยา ${nameTh.split(' (')[0]} แบบรุนแรงค่ะ`);
    }
    setAllergies(newAllergies);
  };

  const setAllergySeverity = (medId: string, severity: 'severe' | 'moderate') => {
    const newAllergies = allergies.map(a => {
      if (a.medId === medId) {
        const severityText = severity === 'severe' ? 'รุนแรง' : 'ปานกลาง';
        const nameTh = ALLERGIES_LIST.find(item => item.id === medId)?.name || medId;
        handleSpeak(`ปรับระดับการแพ้ ${nameTh.split(' (')[0]} เป็นระดับ${severityText}ค่ะ`);
        return { ...a, severity };
      }
      return a;
    });
    setAllergies(newAllergies);
  };

  // บันทึกตู้ยาและบันทึกประวัติของผู้ใช้งานปัจจุบันไว้ใต้คีย์เบอร์โทรศัพท์ก่อนสลับบัญชี
  const saveCurrentUserState = async (currentProfile: any) => {
    if (currentProfile && currentProfile.phone) {
      const cabinet = await AsyncStorage.getItem('@cabinet_meds');
      if (cabinet) {
        await AsyncStorage.setItem(`@cabinet_meds_${currentProfile.phone}`, cabinet);
      }
      const logs = await AsyncStorage.getItem('@activity_logs');
      if (logs) {
        await AsyncStorage.setItem(`@activity_logs_${currentProfile.phone}`, logs);
      }
      const challenge = await AsyncStorage.getItem('@active_challenge');
      if (challenge) {
        await AsyncStorage.setItem(`@active_challenge_${currentProfile.phone}`, challenge);
      } else {
        await AsyncStorage.removeItem(`@active_challenge_${currentProfile.phone}`);
      }
    }
  };

  // โหลดตู้ยาและบันทึกประวัติของผู้ใช้งานใหม่ที่ต้องการเข้าสู่ระบบมาใส่คีย์มาตรฐาน
  const loadNewUserState = async (targetPhone: string) => {
    const cabinet = await AsyncStorage.getItem(`@cabinet_meds_${targetPhone}`);
    await AsyncStorage.setItem('@cabinet_meds', cabinet || JSON.stringify([]));

    const logs = await AsyncStorage.getItem(`@activity_logs_${targetPhone}`);
    await AsyncStorage.setItem('@activity_logs', logs || JSON.stringify([]));

    const challenge = await AsyncStorage.getItem(`@active_challenge_${targetPhone}`);
    if (challenge) {
      await AsyncStorage.setItem('@active_challenge', challenge);
    } else {
      await AsyncStorage.removeItem('@active_challenge');
    }

    // Hydrate Zustand store
    await useAppStore.getState().loadAllFromStorage();
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedBirthdate = birthdate.trim();

    if (!trimmedName) {
      handleSpeak('กรุณากรอกชื่อเล่นของคุณตาด้วยนะคะ');
      return;
    }
    if (!trimmedPhone) {
      handleSpeak('กรุณากรอกเบอร์โทรศัพท์ด้วยนะคะ');
      return;
    }
    if (!trimmedBirthdate) {
      handleSpeak('กรุณากรอกวันเดือนปีเกิดเป็นรหัสผ่านด้วยนะคะ');
      return;
    }

    // ตรวจสอบเบอร์ซ้ำในเครื่อง
    const isDuplicate = allUsers.some(u => u.phone === trimmedPhone);
    if (isDuplicate) {
      handleSpeak('เบอร์โทรศัพท์นี้เคยลงทะเบียนแล้วค่ะ กรุณาสลับหน้าเพื่อเข้าสู่ระบบนะคะ');
      Alert.alert('ลงทะเบียนซ้ำ', 'เบอร์โทรศัพท์นี้ลงทะเบียนในเครื่องแล้วจ้า กรุณาสลับไปแท็บเข้าสู่ระบบ');
      return;
    }

    try {
      // เซฟสถานะบัญชีเดิมก่อน
      if (storeProfile) {
        await saveCurrentUserState(storeProfile);
      }

      const newProfile = {
        registered: true,
        name: trimmedName,
        phone: trimmedPhone,
        birthdate: trimmedBirthdate,
        diseases: selectedDiseases,
        allergies: allergies,
        otherDiseases: otherDiseases.trim(),
        otherAllergies: otherAllergies.trim(),
        syncCode: 'MC-' + Math.floor(1000 + Math.random() * 9000).toString()
      };

      // เซฟลง Zustand store
      await useAppStore.getState().setProfile(newProfile);
      
      // ซิงค์โปรไฟล์ขึ้นหลังบ้านหากออนไลน์อยู่
      await syncProfileWithBackend(newProfile);
      
      // บันทึกสำรองเฉพาะผู้ใช้ด้วย
      await AsyncStorage.setItem(`@cabinet_meds_${trimmedPhone}`, JSON.stringify([]));
      await AsyncStorage.setItem(`@activity_logs_${trimmedPhone}`, JSON.stringify([]));

      await loadNewUserState(trimmedPhone);

      await addActivityLog(`ลงทะเบียนผู้ป่วยใหม่: "${trimmedName}"`);
      handleSpeak(`ลงทะเบียนสำเร็จเรียบร้อยแล้วค่ะ ยินดีต้อนรับนะคะคุณตา ${trimmedName}`);
      router.replace('/');
    } catch (e) {
      console.error(e);
      handleSpeak('เกิดข้อผิดพลาดในการลงทะเบียนค่ะ');
    }
  };

  const handleSaveSettings = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedBirthdate = birthdate.trim();

    if (!trimmedName) {
      handleSpeak('กรุณากรอกชื่อเล่นด้วยนะคะ');
      return;
    }

    try {
      const active = storeProfile || { phone: '', birthdate: '' };
      
      const updatedProfile = {
        ...active,
        name: trimmedName,
        phone: trimmedPhone || (active as any).phone,
        birthdate: trimmedBirthdate || (active as any).birthdate,
        diseases: selectedDiseases,
        allergies: allergies,
        otherDiseases: otherDiseases.trim(),
        otherAllergies: otherAllergies.trim(),
      };

      // เซฟทั้งหมดลง Zustand store
      await useAppStore.getState().setProfile(updatedProfile);
      await useAppStore.getState().setCaregiverPhone(caregiverPhone.trim());
      await useAppStore.getState().setBackendUrl(backendUrl.trim());
      await useAppStore.getState().setDoctorMode(doctorMode);
      await useAppStore.getState().setDeveloperMode(developerMode);

      // ซิงค์โปรไฟล์ที่อัปเดตไปหลังบ้านด้วย
      await syncProfileWithBackend(updatedProfile);

      await addActivityLog(`อัปเดตข้อมูลการตั้งค่าและประวัติคุณตา: "${trimmedName}"`);
      const successMsg = t('saveSuccess');
      handleSpeak(successMsg);
      Alert.alert(language === 'th' ? 'บันทึกสำเร็จ' : 'Success', successMsg);
      router.replace('/');
    } catch (e) {
      console.error(e);
      handleSpeak('เกิดข้อผิดพลาดในการบันทึกค่ะ');
    }
  };

  const handleLogin = async () => {
    const trimmedPhone = loginPhone.trim();
    const trimmedBirthdate = loginBirthdate.trim();

    if (!trimmedPhone) {
      handleSpeak('กรุณากรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้ด้วยนะคะ');
      return;
    }
    if (!trimmedBirthdate) {
      handleSpeak('กรุณากรอกวันเกิดเป็นรหัสผ่านด้วยนะคะ');
      return;
    }

    const matchedUser = allUsers.find(u => u.phone === trimmedPhone && u.birthdate === trimmedBirthdate);
    if (!matchedUser) {
      handleSpeak('ไม่พบข้อมูลผู้ใช้ หรือวันเกิดรหัสผ่านไม่ถูกต้องค่ะ ลองตรวจสอบใหม่อีกครั้งนะคะ');
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่พบข้อมูลผู้ป่วย หรือวันเกิด (รหัสผ่าน) ไม่ถูกต้องค่ะ');
      return;
    }

    try {
      // เซฟสถานะบัญชีเดิมก่อน
      if (storeProfile) {
        await saveCurrentUserState(storeProfile);
      }

      // เซฟลง Zustand store
      await useAppStore.getState().setProfile(matchedUser);
      await loadNewUserState(trimmedPhone);

      await addActivityLog(`เข้าสู่ระบบในชื่อผู้ใช้: "${matchedUser.name}"`);
      handleSpeak(`ยินดีต้อนรับกลับเข้าสู่ระบบค่ะคุณตา ${matchedUser.name}`);
      router.replace('/');
    } catch (e) {
      console.error(e);
      handleSpeak('เกิดข้อผิดพลาดในการเข้าสู่ระบบค่ะ');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}
      >
        {/* Top Header with Back button if already registered */}
        <View style={[styles.topHeader, doctorMode && { backgroundColor: '#E0E0E0', borderColor: '#000' }]}>
          {hasProfile ? (
            <TouchableOpacity 
              style={[styles.backBtn, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}
              onPress={() => router.replace('/')}
            >
              <Feather name="chevron-left" size={24} color="#000" />
              <Text style={[styles.backBtnText, { fontSize: 15 + fontOffset }, doctorMode && { color: '#000' }]}>กลับหน้าหลัก</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 44, justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: doctorMode ? '#000' : '#B71C1C' }}>⚠️ จำเป็นต้องลงทะเบียนก่อนเข้าหน้าหลักค่ะ</Text>
            </View>
          )}
        </View>

        {/* Font Size Selector Row */}
        <View style={[styles.fontSizeRow, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
          <Text style={[styles.fontSizeLabel, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>🔍 ขนาดอักษร:</Text>
          <View style={styles.fontSizeButtons}>
            {['small', 'normal', 'medium', 'large', 'xlarge'].map((size) => {
              let label = '';
              if (size === 'small') label = 'เล็ก';
              else if (size === 'normal') label = 'ปกติ';
              else if (size === 'medium') label = 'กลาง';
              else if (size === 'large') label = 'ใหญ่';
              else if (size === 'xlarge') label = 'ใหญ่มาก';

              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fsBtn,
                    fontSize === size && styles.activeFsBtn,
                  ]}
                  onPress={() => saveFontSizeWithSpeech(size)}
                >
                  <Text style={[styles.fsBtnText, { fontSize: 13 + fontOffset }, fontSize === size && styles.activeFsBtnText]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
              <FontAwesome5 name="heartbeat" size={32} color="#D32F2F" />
              <Text style={[styles.logo, { fontSize: 32 + fontOffset }]}>MaCheck</Text>
            </View>
            <Text style={[styles.title, { fontSize: 22 + fontOffset }]}>ระบบจัดการผู้ป่วยตู้ยา</Text>
            <Text style={[styles.subtitle, { fontSize: 14 + fontOffset }]}>ระบบลงทะเบียนและเข้าสู่ระบบเพื่อเช็กข้อมูลและประวัติการรักษาย้อนหลัง</Text>
          </View>

          {/* Neobrutalist Tab Switcher */}
          <View style={[styles.tabContainer, doctorMode && { borderColor: '#000', backgroundColor: '#FFF' }]}>
            {hasProfile && (
              <TouchableOpacity 
                style={[
                  styles.tabBtn, 
                  activeTab === 'settings' && styles.activeTabBtn,
                  doctorMode && activeTab === 'settings' && { backgroundColor: '#37474F', borderRightWidth: 1.5, borderColor: '#000' }
                ]} 
                onPress={() => {
                  setActiveTab('settings');
                  handleSpeak('สลับมาหน้าข้อมูลและตั้งค่าค่ะ');
                }}
              >
                <Text style={[
                  styles.tabBtnText, 
                  { fontSize: 14 + fontOffset },
                  doctorMode && activeTab === 'settings' && { color: '#FFF' }
                ]}>ข้อมูลและตั้งค่า</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[
                styles.tabBtn, 
                activeTab === 'register' && styles.activeTabBtn,
                doctorMode && activeTab === 'register' && { backgroundColor: '#37474F', borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: '#000' }
              ]} 
              onPress={() => {
                setActiveTab('register');
                handleSpeak('สลับมาหน้าลงทะเบียนผู้ป่วยใหม่ค่ะ');
              }}
            >
              <Text style={[
                styles.tabBtnText, 
                { fontSize: 14 + fontOffset },
                doctorMode && activeTab === 'register' && { color: '#FFF' }
              ]}>ลงทะเบียนใหม่</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.tabBtn, 
                activeTab === 'login' && styles.activeTabBtn,
                doctorMode && activeTab === 'login' && { backgroundColor: '#37474F', borderLeftWidth: 1.5, borderColor: '#000' }
              ]} 
              onPress={() => {
                setActiveTab('login');
                handleSpeak('สลับมาหน้าเข้าสู่ระบบค่ะ');
              }}
            >
              <Text style={[
                styles.tabBtnText, 
                { fontSize: 14 + fontOffset },
                doctorMode && activeTab === 'login' && { color: '#FFF' }
              ]}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'settings' ? (
            /* ================= SETTINGS VIEW ================= */
            <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
              <View style={styles.labelRow}>
                <Feather name="user" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>{t('patientName')}</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder={t('enterPatientName')}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.labelRow}>
                <Feather name="phone-call" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>{t('emergencyPhone')}</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder={t('enterCgPhone')}
                keyboardType="phone-pad"
                value={caregiverPhone}
                onChangeText={setCaregiverPhone}
              />

              <View style={styles.labelRow}>
                <Feather name="server" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>🌐 {t('backendServer')}</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder={t('enterBackendUrl')}
                value={backendUrl}
                onChangeText={setBackendUrl}
              />

              <View style={styles.labelRow}>
                <FontAwesome5 name="briefcase-medical" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>{t('selectedDiseases')}</Text>
              </View>
              <View style={[styles.selectedDiseasesPanel, doctorMode && { backgroundColor: '#EEE', borderColor: '#000' }]}>
                <Text style={[styles.selectedDiseasesText, { fontSize: 16 + fontOffset }]}>
                  {selectedDiseases.length > 0 
                    ? selectedDiseases.map(d => DISEASES_LIST.find(item => item.id === d)?.name).join(', ')
                    : t('noDiseases')}
                </Text>
              </View>

              <View style={styles.labelRow}>
                <FontAwesome5 name="exclamation-triangle" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>🚨 ประวัติแพ้ยาของคุณตา</Text>
              </View>
              <View style={styles.allergiesContainer}>
                {ALLERGIES_LIST.map((item) => {
                   const allergyEntry = allergies.find(a => a.medId === item.id);
                   const isAllergic = !!allergyEntry;
                   const severity = allergyEntry ? allergyEntry.severity : null;
                   const borderColor = isAllergic ? (severity === 'severe' ? '#D32F2F' : '#FF8F00') : '#CCC';
                   const bgColor = isAllergic ? (severity === 'severe' ? '#FFEBEE' : '#FFF3E0') : '#FFFFFF';
                   return (
                     <View 
                       key={item.id}
                       style={[
                         styles.allergyCard,
                         { borderColor: doctorMode ? '#000' : borderColor, backgroundColor: doctorMode ? '#FFF' : bgColor }
                       ]}
                     >
                       <TouchableOpacity
                         style={styles.allergyCardHeader}
                         onPress={() => toggleAllergy(item.id)}
                       >
                         <Text style={[
                           styles.allergyCardTitle, 
                           { fontSize: 13 + fontOffset, color: doctorMode ? '#000' : (isAllergic ? borderColor : '#333') }
                         ]}>
                           {isAllergic ? '✅ ' : ''}{item.name}
                         </Text>
                       </TouchableOpacity>
                       {isAllergic && (
                         <View style={styles.severityBtnRow}>
                           <TouchableOpacity
                             style={[
                               styles.severityBtn,
                               { backgroundColor: severity === 'severe' ? '#D32F2F' : '#EEE', borderColor: '#000' }
                             ]}
                             onPress={() => setAllergySeverity(item.id, 'severe')}
                           >
                             <Text style={[styles.severityBtnText, { fontSize: 11 + fontOffset, color: severity === 'severe' ? '#FFF' : '#333' }]}>
                               รุนแรง
                             </Text>
                           </TouchableOpacity>
                           <TouchableOpacity
                             style={[
                               styles.severityBtn,
                               { backgroundColor: severity === 'moderate' ? '#FF8F00' : '#EEE', borderColor: '#000' }
                             ]}
                             onPress={() => setAllergySeverity(item.id, 'moderate')}
                           >
                             <Text style={[styles.severityBtnText, { fontSize: 11 + fontOffset, color: severity === 'moderate' ? '#FFF' : '#333' }]}>
                               ปานกลาง
                             </Text>
                           </TouchableOpacity>
                         </View>
                       )}
                     </View>
                   );
                })}
              </View>

              <View style={{ marginBottom: 16 }}>
                <View style={styles.labelRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>🩺 โรคประจำตัวอื่น ๆ (ระบุคั่นด้วยเครื่องหมายจุลภาค ,)</Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: 16 + fontOffset }]}
                  placeholder="เช่น ความดันลูกตา, ไมเกรน..."
                  value={otherDiseases}
                  onChangeText={setOtherDiseases}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <View style={styles.labelRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>🩺 {t('otherDiseases')}</Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: 16 + fontOffset }]}
                  placeholder={t('enterOtherDiseases')}
                  value={otherDiseases}
                  onChangeText={setOtherDiseases}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <View style={styles.labelRow}>
                  <FontAwesome5 name="exclamation-circle" size={18} color="#000" />
                  <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>💊 {t('otherAllergies')}</Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: 16 + fontOffset }]}
                  placeholder={t('enterOtherAllergies')}
                  value={otherAllergies}
                  onChangeText={setOtherAllergies}
                />
              </View>

              {/* 🩺 โหมดสำหรับแพทย์ (Doctor Mode) */}
              <View style={[styles.doctorModeContainer, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.doctorModeTitle, { fontSize: 17 + fontOffset }]}>🩺 {t('doctorMode')}</Text>
                  <Text style={[styles.doctorModeDesc, { fontSize: 12 + fontOffset }]}>
                    {t('doctorModeDesc')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.doctorModeToggleBtn, 
                    doctorMode ? styles.doctorModeToggleActive : styles.doctorModeToggleInactive
                  ]}
                  onPress={() => {
                    const nextVal = !doctorMode;
                    setDoctorMode(nextVal);
                    handleSpeak(nextVal ? 'เปิดโหมดสำหรับแพทย์ คมชัดสูงระดับสองสีแล้วค่ะ' : 'ปิดโหมดสำหรับแพทย์แล้วค่ะ');
                  }}
                >
                  <Text style={[styles.doctorModeToggleBtnText, { fontSize: 14 + fontOffset, color: doctorMode ? '#FFF' : '#000' }]}>
                    {doctorMode ? t('statusActive') : t('statusInactive')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ⚙️ โหมดนักพัฒนา (Developer Mode / Simulator Panel) */}
              <View style={[styles.doctorModeContainer, { marginTop: 12 }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.doctorModeTitle, { fontSize: 17 + fontOffset }]}>⚙️ {t('devMode')}</Text>
                  <Text style={[styles.doctorModeDesc, { fontSize: 12 + fontOffset }]}>
                    {t('devModeDesc')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.doctorModeToggleBtn, 
                    developerMode ? styles.doctorModeToggleActive : styles.doctorModeToggleInactive
                  ]}
                  onPress={() => {
                    const nextVal = !developerMode;
                    setDeveloperMode(nextVal);
                    handleSpeak(nextVal ? 'เปิดแผงทดสอบระบบแล้วค่ะ' : 'ปิดแผงทดสอบระบบแล้วค่ะ');
                  }}
                >
                  <Text style={[styles.doctorModeToggleBtnText, { fontSize: 14 + fontOffset, color: developerMode ? '#FFF' : '#000' }]}>
                    {developerMode ? t('statusActive') : t('statusInactive')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 🌐 ภาษา / Language Toggle Button */}
              <View style={[styles.doctorModeContainer, { marginTop: 12 }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.doctorModeTitle, { fontSize: 17 + fontOffset }]}>🌐 {t('changeLanguage')}</Text>
                  <Text style={[styles.doctorModeDesc, { fontSize: 12 + fontOffset }]}>
                    เลือกภาษา / Toggle app language
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity 
                    style={[
                      styles.langBtn, 
                      language === 'th' ? styles.langBtnActive : styles.langBtnInactive
                    ]}
                    onPress={() => {
                      setLanguage('th');
                      handleSpeak('เปลี่ยนภาษาเป็นภาษาไทยแล้วค่ะ');
                    }}
                  >
                    <Text style={[styles.langBtnText, { fontSize: 14 + fontOffset, color: language === 'th' ? '#FFF' : '#000' }]}>
                      ไทย
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.langBtn, 
                      language === 'en' ? styles.langBtnActive : styles.langBtnInactive
                    ]}
                    onPress={() => {
                      setLanguage('en');
                      handleSpeak('Changed language to English.');
                    }}
                  >
                    <Text style={[styles.langBtnText, { fontSize: 14 + fontOffset, color: language === 'en' ? '#FFF' : '#000' }]}>
                      EN
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🩺 ปุ่มเปิดเว็บบอร์ดสำหรับแพทย์ (Doctor Dashboard Portal) */}
              <TouchableOpacity 
                style={[
                  styles.registerBtn, 
                  { 
                    backgroundColor: '#0a7c85', 
                    marginTop: 8, 
                    marginBottom: 16,
                    borderWidth: 0
                  },
                  doctorMode && { backgroundColor: '#37474F', borderColor: '#000' }
                ]} 
                onPress={() => {
                  handleSpeak(language === 'th' ? 'กำลังเปิดหน้าแดชบอร์ดสำหรับแพทย์ค่ะ' : 'Opening doctor portal dashboard.');
                  Linking.openURL('http://localhost:5001/doctor');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome5 name="hospital-user" size={20} color="#FFF" />
                  <Text style={[styles.registerBtnText, { fontSize: 20 + fontOffset }]}>{t('openDoctorPortal')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.registerBtn, { backgroundColor: doctorMode ? '#000' : '#4CAF50' }]} onPress={handleSaveSettings}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="check" size={22} color="#FFF" />
                  <Text style={[styles.registerBtnText, { fontSize: 20 + fontOffset }]}>{t('saveSettings')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : activeTab === 'register' ? (
            /* ================= REGISTER VIEW ================= */
            <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
              <View style={styles.labelRow}>
                <Feather name="user" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>ชื่อเล่นของคุณตา / คุณยาย</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder="ตัวอย่าง: คุณตาเก่ง"
                value={name}
                onChangeText={setName}
              />

              <View style={styles.labelRow}>
                <Feather name="phone" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>เบอร์โทรศัพท์ (ใช้เป็น Username)</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder="ตัวอย่าง: 0812345678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <View style={styles.labelRow}>
                <Feather name="calendar" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>วันเดือนปีเกิด (ใช้เป็น Password)</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder="ตัวอย่าง: 15/08/2495"
                keyboardType="phone-pad"
                value={birthdate}
                onChangeText={(t) => setBirthdate(formatBirthdate(t, birthdate))}
              />

              {/* Diseases Selection inside Register */}
              <View style={{ borderTopWidth: 2, borderColor: doctorMode ? '#000' : '#EEE', paddingTop: 12, marginTop: 8 }}>
                <View style={styles.labelRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>โรคประจำตัวของคุณตา</Text>
                </View>
                <View style={styles.diseasesContainer}>
                  {DISEASES_LIST.map((disease) => {
                     const isSelected = selectedDiseases.includes(disease.id);
                     return (
                       <TouchableOpacity
                         key={disease.id}
                         style={[
                           styles.diseaseBtn, 
                           isSelected && { backgroundColor: doctorMode ? '#37474F' : disease.color, borderColor: '#000' }
                         ]}
                         onPress={() => toggleDisease(disease.id, disease.name)}
                       >
                         <FontAwesome5 
                           name={disease.icon} 
                           size={18} 
                           color={isSelected ? '#FFF' : '#000'} 
                         />
                         <Text style={[styles.diseaseBtnText, { fontSize: 16 + fontOffset }, isSelected && styles.selectedText]}>
                           {disease.name}
                         </Text>
                         {isSelected && (
                           <Feather name="check-circle" size={14} color="#FFF" style={styles.checkIcon} />
                         )}
                       </TouchableOpacity>
                     );
                  })}
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <View style={styles.labelRow}>
                  <FontAwesome5 name="exclamation-triangle" size={18} color="#000" />
                  <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>🚨 ประวัติแพ้ยา (ถ้ามี กดเลือกยาที่แพ้ได้เลยค่ะ)</Text>
                </View>
                <View style={styles.allergiesContainer}>
                  {ALLERGIES_LIST.map((item) => {
                     const allergyEntry = allergies.find(a => a.medId === item.id);
                     const isAllergic = !!allergyEntry;
                     const severity = allergyEntry ? allergyEntry.severity : null;
                     const borderColor = isAllergic ? (severity === 'severe' ? '#D32F2F' : '#FF8F00') : '#CCC';
                     const bgColor = isAllergic ? (severity === 'severe' ? '#FFEBEE' : '#FFF3E0') : '#FFFFFF';
                     return (
                       <View 
                         key={item.id}
                         style={[
                           styles.allergyCard,
                           { borderColor: doctorMode ? '#000' : borderColor, backgroundColor: doctorMode ? '#FFF' : bgColor }
                         ]}
                       >
                         <TouchableOpacity
                           style={styles.allergyCardHeader}
                           onPress={() => toggleAllergy(item.id)}
                         >
                           <Text style={[
                             styles.allergyCardTitle, 
                             { fontSize: 13 + fontOffset, color: doctorMode ? '#000' : (isAllergic ? borderColor : '#333') }
                           ]}>
                             {isAllergic ? '✅ ' : ''}{item.name}
                           </Text>
                         </TouchableOpacity>
                         {isAllergic && (
                           <View style={styles.severityBtnRow}>
                             <TouchableOpacity
                               style={[
                                 styles.severityBtn,
                                 { backgroundColor: severity === 'severe' ? '#D32F2F' : '#EEE', borderColor: '#000' }
                               ]}
                               onPress={() => setAllergySeverity(item.id, 'severe')}
                             >
                               <Text style={[styles.severityBtnText, { fontSize: 11 + fontOffset, color: severity === 'severe' ? '#FFF' : '#333' }]}>
                                 รุนแรง
                               </Text>
                             </TouchableOpacity>
                             <TouchableOpacity
                               style={[
                                 styles.severityBtn,
                                 { backgroundColor: severity === 'moderate' ? '#FF8F00' : '#EEE', borderColor: '#000' }
                               ]}
                               onPress={() => setAllergySeverity(item.id, 'moderate')}
                             >
                               <Text style={[styles.severityBtnText, { fontSize: 11 + fontOffset, color: severity === 'moderate' ? '#FFF' : '#333' }]}>
                                 ปานกลาง
                               </Text>
                             </TouchableOpacity>
                           </View>
                         )}
                       </View>
                     );
                  })}
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <View style={styles.labelRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>🩺 โรคประจำตัวอื่น ๆ (ระบุคั่นด้วยเครื่องหมายจุลภาค ,)</Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: 16 + fontOffset }]}
                  placeholder="เช่น ความดันลูกตา, ไมเกรน..."
                  value={otherDiseases}
                  onChangeText={setOtherDiseases}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <View style={styles.labelRow}>
                  <FontAwesome5 name="exclamation-circle" size={18} color="#000" />
                  <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>💊 ยาอื่น ๆ ที่แพ้ (ระบุคั่นด้วยเครื่องหมายจุลภาค ,)</Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: 16 + fontOffset }]}
                  placeholder="เช่น ยาเพนิซิลลิน, ซัลฟา..."
                  value={otherAllergies}
                  onChangeText={setOtherAllergies}
                />
              </View>

              <TouchableOpacity style={[styles.registerBtn, doctorMode && { backgroundColor: '#000' }]} onPress={handleRegister}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="user-plus" size={22} color="#FFF" />
                  <Text style={[styles.registerBtnText, { fontSize: 20 + fontOffset }]}>บันทึกและเริ่มใช้งาน</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= LOGIN VIEW ================= */
            <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
              <View style={styles.labelRow}>
                <Feather name="phone" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>เบอร์โทรศัพท์ (Username)</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder="กรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้..."
                keyboardType="phone-pad"
                value={loginPhone}
                onChangeText={setLoginPhone}
              />

              <View style={styles.labelRow}>
                <Feather name="lock" size={18} color="#000" />
                <Text style={[styles.labelText, { fontSize: 17 + fontOffset }]}>วันเดือนปีเกิด (Password)</Text>
              </View>
              <TextInput
                style={[styles.input, { fontSize: 18 + fontOffset }]}
                placeholder="กรอกวันเดือนปีเกิด (เช่น 15/08/2495)"
                keyboardType="phone-pad"
                value={loginBirthdate}
                onChangeText={(t) => setLoginBirthdate(formatBirthdate(t, loginBirthdate))}
              />

              <TouchableOpacity style={[styles.registerBtn, { backgroundColor: doctorMode ? '#000' : '#2196F3' }]} onPress={handleLogin}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="log-in" size={22} color="#FFF" />
                  <Text style={[styles.registerBtnText, { fontSize: 20 + fontOffset }]}>เข้าสู่ระบบตู้ยา</Text>
                </View>
              </TouchableOpacity>

              {/* Quick Login Patient List for Elderly Ease-of-Use */}
              {allUsers.length > 0 && (
                <View style={styles.quickLoginSection}>
                  <Text style={[styles.quickLoginTitle, { fontSize: 15 + fontOffset }]}>ผู้ป่วยในเครื่องนี้ (แตะเพื่อสลับเข้าด่วน):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLoginScroll}>
                    {allUsers.map((u) => (
                      <TouchableOpacity 
                        key={u.phone} 
                        style={styles.quickUserCard}
                        onPress={() => {
                          setLoginPhone(u.phone);
                          handleSpeak(`สลับข้อมูลไปที่คุณตา ${u.name} กรุณากรอกรหัสวันเกิดค่ะ`);
                        }}
                      >
                        <View style={styles.quickUserAvatar}>
                          <FontAwesome5 name="user-alt" size={14} color="#000" />
                        </View>
                        <Text style={[styles.quickUserName, { fontSize: 15 + fontOffset }]}>{u.name}</Text>
                        <Text style={[styles.quickUserPhone, { fontSize: 12 + fontOffset }]}>{u.phone}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SeniorColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: SeniorColors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SeniorColors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  headerBanner: {
    backgroundColor: SeniorColors.primarySoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.primary,
    borderRadius: 20,
    padding: 20,
    boxShadow: '0px 8px 22px rgba(31, 122, 92, 0.10)',
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: SeniorColors.primaryDark,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: SeniorColors.text,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: SeniorColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 14,
    backgroundColor: SeniorColors.surface,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SeniorColors.surface,
    minHeight: 56,
  },
  activeTabBtn: {
    backgroundColor: SeniorColors.primarySoft,
    borderColor: SeniorColors.primary,
  },
  tabBtnText: {
    fontSize: 17,
    fontWeight: '900',
    color: SeniorColors.text,
  },
  card: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 20,
    padding: 16,
    boxShadow: '0px 8px 22px rgba(31, 122, 92, 0.10)',
    gap: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    color: SeniorColors.text,
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  labelText: {
    fontSize: 17,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  input: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    minHeight: 56,
    marginBottom: 8,
    color: SeniorColors.text,
  },
  diseasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  diseaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
    minHeight: 56,
  },
  diseaseBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  selectedText: {
    color: '#FFF',
  },
  checkIcon: {
    marginLeft: 4,
  },
  registerBtn: {
    backgroundColor: SeniorColors.primary,
    borderWidth: 0,
    borderRadius: 16,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 8px 18px rgba(31, 122, 92, 0.18)',
    marginTop: 16,
  },
  registerBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  quickLoginSection: {
    marginTop: 20,
    borderTopWidth: 2,
    borderColor: '#EEEEEE',
    paddingTop: 16,
    gap: 8,
  },
  quickLoginTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  quickLoginScroll: {
    gap: 12,
    paddingVertical: 6,
  },
  quickUserCard: {
    backgroundColor: SeniorColors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    padding: 10,
    width: 140,
    alignItems: 'center',
    gap: 4,
  },
  quickUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE082',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  quickUserName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000',
  },
  quickUserPhone: {
    fontSize: 12,
    color: '#555',
    fontWeight: '700',
  },
  fontSizeRow: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'column',
    gap: 8,
  },
  fontSizeLabel: {
    fontWeight: '800',
    color: SeniorColors.text,
  },
  fontSizeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  fsBtn: {
    flex: 1,
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 48,
  },
  activeFsBtn: {
    backgroundColor: SeniorColors.primarySoft,
    borderColor: SeniorColors.primary,
  },
  fsBtnText: {
    fontWeight: '800',
    color: SeniorColors.text,
  },
  activeFsBtnText: {
    fontWeight: '900',
  },
  selectedDiseasesPanel: {
    backgroundColor: SeniorColors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  selectedDiseasesText: {
    fontWeight: '800',
    color: SeniorColors.textSecondary,
  },
  doctorModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SeniorColors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  doctorModeTitle: {
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  doctorModeDesc: {
    fontWeight: '700',
    color: '#555',
    lineHeight: 16,
  },
  doctorModeToggleBtn: {
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
    minHeight: 48,
    alignItems: 'center',
  },
  doctorModeToggleActive: {
    backgroundColor: '#37474F',
  },
  doctorModeToggleInactive: {
    backgroundColor: '#FFF',
  },
  doctorModeToggleBtnText: {
    fontWeight: '900',
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  allergyCard: {
    width: '48%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 72,
  },
  allergyCardHeader: {
    width: '100%',
    alignItems: 'center',
  },
  allergyCardTitle: {
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },
  severityBtnRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
    width: '100%',
  },
  severityBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  severityBtnText: {
    fontWeight: '800',
  },
  langBtn: {
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnActive: {
    backgroundColor: SeniorColors.primary,
    borderColor: '#000',
  },
  langBtnInactive: {
    backgroundColor: '#FFF',
  },
  langBtnText: {
    fontWeight: '900',
  },
});
