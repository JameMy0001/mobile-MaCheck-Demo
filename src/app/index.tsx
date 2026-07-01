import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Platform, Modal, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { addActivityLog, getRemoteProfile, clearRemoteNudge } from '../api';
import { useAppStore } from '../store/useAppStore';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { useSound } from '@/hooks/use-sound';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useCustomAlert } from '@/hooks/use-custom-alert';

const IconSettings = require('../../assets/images/icons/icon_settings.png');
const IconPill = require('../../assets/images/icons/icon_pill.png');
const IconWaterDrop = require('../../assets/images/icons/icon_water_drop.png');
const IconGlassWater = require('../../assets/images/icons/icon_glass_water.png');
const IconBell = require('../../assets/images/icons/icon_bell.png');
const IconSiren = require('../../assets/images/icons/icon_siren.png');
const IconVoiceChat = require('../../assets/images/icons/icon_voice_chat.png');
const IconNurseGirl = require('../../assets/images/icons/icon_nurse_girl.png');
const IconKey = require('../../assets/images/icons/icon_key.png');


export default function HomeScreen() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);
  const activeChallenge = useAppStore((state) => state.activeChallenge);
  const setActiveChallenge = useAppStore((state) => state.setActiveChallenge);
  const setProfile = useAppStore((state) => state.setProfile);
  const caregiverPhone = useAppStore((state) => state.caregiverPhone);

  const cabinetCount = cabinet.length;
  const [speedUp, setSpeedUp] = useState(false);


  // Sound control (shared hook)
  const { isSoundMuted, handleSpeak, toggleSound } = useSound();

  // Font Resizing (shared hook)
  const { fontOffset } = useFontSize();

  // settings & doctor mode states
  const { doctorMode } = useDoctorMode();

  // alert simulator states
  const [alertSimModalVisible, setAlertSimModalVisible] = useState(false);
  const [activeSimLevel, setActiveSimLevel] = useState<number | null>(null);
  const simWarningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom Alert (shared hook)
  const { customAlert, setCustomAlert } = useCustomAlert();

  const toggleSoundWithGreeting = () => toggleSound('เปิดเสียงนำทางแล้วจ้าคุณตา');

  const handleLogout = async () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบตู้ยาใช่ไหมคะคุณตา?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            try {
              // ล้างสถานะปัจจุบัน
              await AsyncStorage.removeItem('@user_profile');
              Speech.speak('ออกจากระบบสำเร็จแล้วค่ะ', { language: 'th-TH', rate: 0.9 });
              router.replace('/register');
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (!profile) {
      router.replace('/register');
      return;
    }

    // 1. นาฬิกา
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);

    // 2. เช็กสัญญาณสะกิดระยะไกลจากคลาวด์ทุกๆ 5 วินาที
    const checkRemoteNudge = async () => {
      try {
        if (profile && profile.phone) {
          const remoteProf = await getRemoteProfile(profile.phone);
          if (remoteProf && remoteProf.pending_nudge) {
            const nudge = remoteProf.pending_nudge;
            await clearRemoteNudge(profile.phone);

            setCustomAlert({
              visible: true,
              title: nudge.type === 'med' ? '🚨 ถึงเวลาทานยาแล้วจ้า' : nudge.type === 'water' ? '💧 ดื่มน้ำกันหน่อยนะจ้า' : '💬 ข้อความจากลูกหลาน',
              message: nudge.text,
              type: nudge.type === 'med' ? 'error' : nudge.type === 'water' ? 'water' : 'info'
            });

            handleSpeak(nudge.text);
            await addActivityLog(`ได้รับสัญญาณสะกิดระยะไกลจากลูกหลาน: "${nudge.text}"`);
          }
        }
      } catch (err) {
        console.error('Remote nudge fetch failed', err);
      }
    };

    checkRemoteNudge();
    const nudgeInterval = setInterval(checkRemoteNudge, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(nudgeInterval);
    };
  }, [profile]);

  // ระบบนับถอยหลังชาเลนจ์ออฟไลน์
  useEffect(() => {
    if (!activeChallenge || activeChallenge.timeLeft <= 0) return;

    const challengeTimer = setInterval(async () => {
      try {
        if (!activeChallenge) return;
        const current = { ...activeChallenge };

        if (current.timeLeft <= 0) {
          clearInterval(challengeTimer);
          const isMany = current.medName === 'manymeds';
          const alertMsg = isMany 
            ? 'ครบเวลา 1 ชั่วโมงแล้วค่ะคุณตา สามารถทานยาชุดที่ 2 ได้อย่างปลอดภัยแล้วค่ะ' 
            : `ครบเวลาเว้นระยะห่าง 2 ชั่วโมงแล้วค่ะคุณตา สามารถทานยาแก้ปวด ${current.medName} ได้อย่างปลอดภัยแล้วค่ะ`;
          handleSpeak(alertMsg);
          
          current.timeLeft = 0;
          await setActiveChallenge(current);
        } else {
          const step = speedUp ? 600 : 1;
          current.timeLeft = Math.max(0, current.timeLeft - step);
          await setActiveChallenge(current);
        }
      } catch (e) {
        console.error(e);
      }
    }, 1000);

    return () => clearInterval(challengeTimer);
  }, [activeChallenge, speedUp]);



  const navTo = (path: any, speechText?: string) => {
    if (speechText) handleSpeak(speechText);
    router.push(path);
  };

  // บันทึกดื่มน้ำในชาเลนจ์
  const recordWater = async () => {
    if (!activeChallenge) return;
    const newCups = Math.min(4, (activeChallenge.waterCups || 0) + 1);
    const updated = {
      ...activeChallenge,
      waterCups: newCups
    };
    await setActiveChallenge(updated);

    const speeches = [
      'คุณตาจิบน้ำแก้วแรกแล้ว สดชื่นกระปรี้กระเปร่าขึ้นทันทีเลยค่ะ',
      'แก้วที่สองเรียบร้อย ช่วยเจือจางยาและถนอมระบบกระเพาะอาหารนะคะคุณตา',
      'ยอดเยี่ยมค่ะแก้วที่สามแล้ว ช่วยลดความตึงเครียดของหลอดเลือดหัวใจได้ดีมากค่ะ',
      'สุดยอดเลยค่ะคุณตาดื่มครบสี่แก้วแล้ว ร่างกายคุณตาได้รับน้ำอุ่นใจอย่างสมบูรณ์แล้วค่ะ'
    ];
    handleSpeak(speeches[newCups - 1]);
    await addActivityLog(`คุณตากดบันทึกจิบน้ำสะสม แก้วที่: ${newCups}`);
    
    // แสดงป๊อปอัปแจ้งเตือนสวยงามตามคำสั่งคุณตา
    setCustomAlert({
      visible: true,
      title: `บันทึกกินน้ำสำเร็จ!`,
      message: `กินน้ำครั้งที่ ${newCups} / 4 เรียบร้อยแล้วค่ะคุณตา!\n\n${speeches[newCups - 1]}`,
      type: 'water',
      waterCup: newCups
    });
  };

  // ปิดชาเลนจ์
  const finishChallenge = async () => {
    if (!activeChallenge) return;
    await setActiveChallenge(null);
    handleSpeak('สิ้นสุดภารกิจความปลอดภัยเรียบร้อย ขอให้สุขภาพร่างกายแข็งแรงนะคะคุณตา');
    await addActivityLog(`คุณตาสิ้นสุดภารกิจความปลอดภัยเว้นระยะยา: "${activeChallenge.medName}"`);
  };


  const makeEmergencyCall = () => {
    const phone = caregiverPhone || profile?.phone || 'สายด่วน 1669';
    handleSpeak(`กำลังจำลองการโทรด่วนไปที่เบอร์ ${phone} และสายด่วนสิบหกหกเก้าค่ะ`);
    addActivityLog('คุณตากดปุ่มเรียกสายด่วนฉุกเฉิน');
    setCustomAlert({
      visible: true,
      title: 'สายด่วนฉุกเฉิน',
      message: `กำลังจำลองการโทรด่วนไปที่เบอร์ผู้ดูแล: ${phone}\nและศูนย์แพทย์สายด่วนฉุกเฉิน: 1669`,
      type: 'call',
      phone: phone
    });
  };

  const openAlertSimulator = () => {
    setAlertSimModalVisible(true);
    handleSpeak('เปิดเครื่องจำลองระดับการแจ้งเตือนแล้วค่ะ เลือกระดับที่ต้องการทดสอบได้เลยนะคะ');
    addActivityLog('เปิดเครื่องจำลองระดับแจ้งเตือน (Alert Simulator)');
  };

  const simulateAlert = (level: number) => {
    if (simWarningTimerRef.current) {
      clearInterval(simWarningTimerRef.current);
      simWarningTimerRef.current = null;
    }
    Speech.stop();

    setActiveSimLevel(level);
    setAlertSimModalVisible(false);

    if (level === 1) {
      handleSpeak('คุณตาคะ ถึงเวลากินยาแล้วนะคะ อย่าลืมกินยาตามเวลาที่คุณหมอสั่งด้วยนะคะ');
      addActivityLog('🔔 จำลองแจ้งเตือนระดับ 1: LINE Notification');
    } else if (level === 2) {
      const msg = 'คุณตาคะ! ลืมกินยาแล้วค่ะ! กรุณากินยาเดี๋ยวนี้เลยนะคะ เรื่องยาสำคัญมากค่ะ!';
      handleSpeak(msg);
      addActivityLog('⚠️ จำลองแจ้งเตือนระดับ 2: แบนเนอร์กระพริบ + เสียงเตือนซ้ำ');
      
      simWarningTimerRef.current = setInterval(() => {
        handleSpeak(msg);
      }, 8000);
    } else if (level === 3) {
      const msg = 'ฉุกเฉินค่ะ! คุณตาไม่ได้กินยาสำคัญมาหลายมื้อแล้ว อาจเป็นอันตรายต่อชีวิต กรุณาโทรหาแพทย์ หรือกดปุ่มโทรหนึ่งหกหกเก้าทันทีค่ะ!';
      handleSpeak(msg);
      addActivityLog('🚨 จำลองแจ้งเตือนระดับ 3: ไซเรนฉุกเฉิน + โทร 1669');

      simWarningTimerRef.current = setInterval(() => {
        handleSpeak(msg);
      }, 6000);
    }
  };

  const stopAlertSimulation = () => {
    if (simWarningTimerRef.current) {
      clearInterval(simWarningTimerRef.current);
      simWarningTimerRef.current = null;
    }
    Speech.stop();
    setActiveSimLevel(null);
    handleSpeak('หยุดการจำลองแจ้งเตือนทั้งหมดแล้วค่ะ');
    addActivityLog('หยุดการจำลองแจ้งเตือนทั้งหมด');
  };

  const [flashColorToggle, setFlashColorToggle] = useState(false);

  useEffect(() => {
    if (activeSimLevel !== 2 && activeSimLevel !== 3) {
      return;
    }
    const flashTimer = setInterval(() => {
      setFlashColorToggle(prev => !prev);
    }, 500);
    return () => clearInterval(flashTimer);
  }, [activeSimLevel]);

  const simulateCall = (num: string) => {
    handleSpeak(`กำลังโทรฉุกเฉินไปที่เบอร์ ${num} ค่ะ`);
    Alert.alert('กำลังโทรออก (จำลอง)', `โทรจำลองไปที่: ${num}`);
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <View style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}>
        
        {/* Yellow Header */}
        <View style={[styles.yellowHeader, doctorMode && { backgroundColor: '#E0E0E0', borderColor: '#000' }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={[styles.iconBtn, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]} onPress={() => navTo('/register', 'แก้ไขประวัติของคุณตาค่ะ')}>
              <Feather name="settings" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]} onPress={toggleSoundWithGreeting}>
              <Feather name={isSoundMuted ? "volume-x" : "volume-2"} size={24} color="#000" />
            </TouchableOpacity>
            <Text style={[styles.headerTime, { fontSize: 24 + fontOffset }, doctorMode && { color: '#000' }]}>{currentTime}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.textBtn, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]} onPress={() => navTo('/cabinet', 'เปิดตู้ยาค่ะ')}>
              <Text style={[styles.headerBtnText, { fontSize: 18 + fontOffset }, doctorMode && { color: '#000' }]}>ตู้ยา ({cabinetCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]} onPress={() => navTo('/cabinet', 'เปิดตู้ยาค่ะ')}>
              <MaterialCommunityIcons name="cupboard" size={26} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Status Banner */}
          <View style={[styles.statusBanner, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            <View style={styles.avatarContainer}>
              <FontAwesome5 name="user-circle" size={54} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusText, { fontSize: 18 + fontOffset }, doctorMode && { color: '#000' }]}>
                สวัสดีครับคุณตา <Text style={styles.boldText}>{profile?.name || 'กำลังโหลด...'}</Text>
              </Text>
              <Text style={[styles.subtitleText, { fontSize: 14 + fontOffset }, doctorMode && { color: '#555' }]}>
                ตู้ยา MaCheck พร้อมดูแลความปลอดภัยออฟไลน์ 100% แล้วน้า
              </Text>
            </View>
            <TouchableOpacity style={[styles.logoutBtn, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]} onPress={handleLogout}>
              <Feather name="log-out" size={22} color={doctorMode ? '#000' : '#B71C1C'} />
              <Text style={[styles.logoutBtnText, { fontSize: 13 + fontOffset }, doctorMode && { color: '#000' }]}>ออก</Text>
            </TouchableOpacity>
          </View>

          {/* Spacing & Water Challenge Widget (Dynamic Panel) */}
          {activeChallenge && (
            <View style={styles.challengeContainer}>
              <View style={styles.challengeHeader}>
                <Image source={IconWaterDrop} style={{ width: 24, height: 24, resizeMode: 'contain', marginRight: 6 }} />
                <Text style={styles.challengeTitle}>ชาเลนจ์เว้นระยะยา & จิบน้ำลดกังวล</Text>
              </View>
              
              <Text style={styles.challengeDesc}>
                กำลังเว้นระยะห่างยาแก้ปวด **{activeChallenge.medName}** เพื่อป้องกันแผลในกระเพาะอาหารและถนอมไต
              </Text>

              {/* Progress bar */}
              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBar, { width: `${((activeChallenge.maxTime - activeChallenge.timeLeft) / activeChallenge.maxTime) * 100}%` }]} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Feather name="clock" size={16} color="#000" />
                <Text style={styles.timeLeftText}>เวลาที่เหลือ: {formatDuration(activeChallenge.timeLeft)}</Text>
              </View>

              {/* Water Cups */}
              <View style={styles.waterBox}>
                <Text style={styles.waterTitle}>บันทึกจิบน้ำสะสม ({activeChallenge.waterCups || 0} / 4 แก้ว):</Text>
                <View style={styles.dropsRow}>
                  {[1, 2, 3, 4].map(idx => (
                    <Image 
                      key={idx} 
                      source={IconGlassWater}
                      style={[{ width: 32, height: 32, marginRight: 8, resizeMode: 'contain' }, (activeChallenge.waterCups || 0) < idx && { opacity: 0.3 }]}
                    />
                  ))}
                </View>

                {activeChallenge.timeLeft > 0 ? (
                  <View style={styles.challengeControls}>
                    <TouchableOpacity style={styles.recordWaterBtn} onPress={recordWater}>
                      <Image source={IconGlassWater} style={{ width: 18, height: 18, marginRight: 6, resizeMode: 'contain' }} />
                      <Text style={styles.recordWaterBtnText}>บันทึกจิบน้ำ 1 แก้ว</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.speedBtn, speedUp && styles.speedBtnActive]} 
                      onPress={() => setSpeedUp(!speedUp)}
                    >
                      <Feather name="clock" size={16} color="#000" style={{ marginRight: 4 }} />
                      <Text style={styles.speedBtnText}>{speedUp ? 'เร่งความเร็วอยู่ (x600)' : 'จำลองเร่งเวลา'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.successText}>ครบเวลาแล้ว! ทานยาชุดถัดไปหรือทำกิจกรรมต่อได้อย่างปลอดภัยค่ะ</Text>
                    <TouchableOpacity style={styles.finishChallengeBtn} onPress={finishChallenge}>
                      <Feather name="check-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.finishChallengeBtnText}>จบภารกิจความปลอดภัย</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Main Menu Grid */}
          <View style={styles.menuContainer}>
            {/* Camera Scan (Red) */}
            <TouchableOpacity 
              style={[styles.neoBtn, styles.btnRed, doctorMode && { backgroundColor: '#37474F', borderColor: '#000' }]} 
              onPress={() => navTo('/scanner', 'เปิดกล้องสแกนซองยาค่ะ')}
            >
              <View style={styles.whiteIconCard}>
                <Feather name="camera" size={36} color="#000" />
              </View>
              <Text style={styles.btnRedText}>สแกนเช็ก{'\n'}ยาตีกัน</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              {/* Food Clashes (Yellow) */}
              <TouchableOpacity 
                style={[styles.neoBtn, styles.btnYellow, { flex: 1 }, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]} 
                onPress={() => navTo('/food-clash', 'เช็กของแสลงค่ะ')}
              >
                <FontAwesome5 name="apple-alt" size={28} color="#000" style={styles.yellowBtnIcon} />
                <Text style={[styles.btnYellowText, doctorMode && { color: '#000' }]}>เช็กของแสลง{'\n'}/อาหาร</Text>
              </TouchableOpacity>

              {/* Emergency (Purple) */}
              <TouchableOpacity 
                style={[styles.neoBtn, styles.btnPurple, { flex: 1 }, doctorMode && { backgroundColor: '#37474F', borderColor: '#000' }]} 
                onPress={makeEmergencyCall}
              >
                <Feather name="phone-call" size={32} color="#FFF" style={styles.purpleBtnIcon} />
                <Text style={styles.btnPurpleText}>โทรหาลูกหลาน{'\n'}/สายด่วน</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chatbot Button (Orange) */}
          <TouchableOpacity 
            style={[styles.neoBtn, styles.btnOrange, { marginHorizontal: 16 }, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]} 
            onPress={() => navTo('/chatbot', 'คุยกับหลานรัก AI ค่ะ')}
          >
            <Image source={IconVoiceChat} style={{ width: 24, height: 24, resizeMode: 'contain', marginRight: 8 }} />
            <Text style={[styles.btnOrangeText, doctorMode && { color: '#000' }]}>คุยกับหลานรัก AI (ด้วยเสียง)</Text>
          </TouchableOpacity>

          {/* Alert Simulator Button (Orange/Amber) */}
          <TouchableOpacity 
            style={[
              styles.neoBtn, 
              { marginHorizontal: 16, marginTop: 12, backgroundColor: doctorMode ? '#ECEFF1' : '#FF6F00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 3, borderColor: '#000', boxShadow: '3px 3px 0px #000' }
            ]} 
            onPress={openAlertSimulator}
          >
            <Feather name="bell" size={22} color={doctorMode ? '#000' : '#FFF'} style={{ marginRight: 8 }} />
            <Text style={{ color: doctorMode ? '#000' : '#FFF', fontWeight: '900', fontSize: 16 }}>🔔 เปิดทดสอบระบบแจ้งเตือน (3 ระดับ)</Text>
          </TouchableOpacity>

          {/* Caregiver Mirror Button (Blue) */}
          <View style={styles.mirrorContainer}>
            <TouchableOpacity 
              style={[styles.neoBtn, styles.btnBlue, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}
              onPress={() => navTo('/caregiver', 'เปิดระบบติดตามประวัติสำหรับลูกหลานค่ะ')}
            >
              <Image source={IconNurseGirl} style={{ width: 22, height: 22, resizeMode: 'contain', marginRight: 6 }} />
              <Text style={[styles.btnBlueText, doctorMode && { color: '#000' }]}>เปิดหน้าจอลูกหลาน (Mirror)</Text>
            </TouchableOpacity>
            <View style={[styles.syncBadge, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
              <Text style={[styles.syncText, doctorMode && { color: '#000' }]}>
                <Image source={IconKey} style={{ width: 16, height: 16, resizeMode: 'contain', marginRight: 4 }} /> รหัสติดตามคุณตา (คลาวด์): <Text style={[styles.syncCode, doctorMode && { color: '#000' }]}>{profile?.syncCode || '------'}</Text>
              </Text>
            </View>
          </View>

        </ScrollView>


        {/* Custom Alert & Emergency Calling Modal */}
        <CustomAlertModal
          visible={customAlert.visible}
          alert={customAlert}
          onClose={() => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            if (customAlert.onDismiss) customAlert.onDismiss();
          }}
          doctorMode={doctorMode}
          fontOffset={fontOffset}
        />

        {/* Alert Simulator Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={alertSimModalVisible}
          onRequestClose={() => setAlertSimModalVisible(false)}
        >
          <View style={styles.alertModalBg}>
            <View style={[styles.alertCard, { borderColor: '#FF6F00' }]}>
              <View style={[styles.alertHeaderBadge, { backgroundColor: '#FF6F00' }]}>
                <Feather name="bell" size={24} color="#FFF" />
              </View>
              <Text style={[styles.alertTitle, { fontSize: 20 + fontOffset }]}>🔔 ทดสอบระบบจำลองแจ้งเตือน</Text>
              <Text style={[styles.alertMessage, { fontSize: 14 + fontOffset }]}>
                กรุณาเลือกความรุนแรงของการแจ้งเตือนที่ต้องการจำลองเพื่อการทดสอบระบบค่ะ
              </Text>
              
              <TouchableOpacity 
                style={[styles.simChoiceBtn, { backgroundColor: '#4CAF50' }]} 
                onPress={() => simulateAlert(1)}
              >
                <Text style={styles.simChoiceBtnText}>🟢 Level 1: แจ้งเตือนทาง LINE</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.simChoiceBtn, { backgroundColor: '#FF9800' }]} 
                onPress={() => simulateAlert(2)}
              >
                <Text style={styles.simChoiceBtnText}>🟡 Level 2: เสียงเตือนซ้ำ + แถบกระพริบ</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.simChoiceBtn, { backgroundColor: '#D32F2F' }]} 
                onPress={() => simulateAlert(3)}
              >
                <Text style={styles.simChoiceBtnText}>🔴 Level 3: ไซเรนฉุกเฉิน + สายด่วน</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.simChoiceBtn, { backgroundColor: '#FFF', borderColor: '#000', borderWidth: 2 }]} 
                onPress={() => setAlertSimModalVisible(false)}
              >
                <Text style={[styles.simChoiceBtnText, { color: '#000' }]}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Level 1: Simulated LINE Chat Notification */}
        {activeSimLevel === 1 && (
          <View style={styles.linePopup}>
            <View style={styles.linePopupHeader}>
              <Text style={styles.linePopupTitle}>LINE</Text>
              <Text style={styles.linePopupSubtitle}>ตู้ยาอุ่นใจแจ้งเตือน</Text>
              <Text style={styles.linePopupTime}>เมื่อกี้</Text>
            </View>
            <View style={styles.linePopupBody}>
              <View style={styles.lineBubble}>
                <Text style={styles.lineBubbleText}>
                  🔔 คุณตาคะ ถึงเวลากินยาแล้วนะคะ อย่าลืมกินยาตามเวลาที่คุณหมอสั่งด้วยนะคะ 💊❤️
                </Text>
              </View>
              <Text style={styles.lineBubbleAuthor}>หลานสาวตู้ยาอุ่นใจ</Text>
            </View>
            <TouchableOpacity style={styles.linePopupBtn} onPress={stopAlertSimulation}>
              <Text style={styles.linePopupBtnText}>✓ รับทราบ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Level 2: Flashing Orange Warning Banner */}
        {activeSimLevel === 2 && (
          <View style={[styles.flashBanner, { backgroundColor: flashColorToggle ? '#FF3D00' : '#FF9100' }]}>
            <Text style={styles.flashBannerText}>⚠️ คุณตา! ลืมกินยาแล้วค่ะ! กรุณากินยาเดี๋ยวนี้เลยนะคะ! ⚠️</Text>
            <TouchableOpacity style={styles.flashBannerBtn} onPress={stopAlertSimulation}>
              <Text style={styles.flashBannerBtnText}>หยุดเตือน</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Level 3: Full-screen Emergency Red Modal */}
        {activeSimLevel === 3 && (
          <Modal animationType="fade" transparent={true} visible={true}>
            <View style={[styles.emergencyModalBg, { backgroundColor: flashColorToggle ? 'rgba(183, 28, 28, 0.98)' : 'rgba(211, 47, 47, 0.98)' }]}>
              <View style={[styles.alertCard, { backgroundColor: '#FFF', borderColor: '#D32F2F', borderWidth: 4, width: '90%', maxWidth: 360 }]}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={styles.sirenIconBadge}>
                    <FontAwesome5 name="lightbulb" size={32} color="#D32F2F" />
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#D32F2F', marginTop: 10 }}>
                    🚨 ฉุกเฉิน! ลืมกินยาสำคัญ
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 24, marginBottom: 20 }}>
                  คุณตาไม่ได้กินยาสำคัญมาหลายมื้อแล้ว{"\n"}
                  อาจเป็นอันตรายต่อสุขภาพอย่างร้ายแรง{"\n"}
                  กรุณาติดต่อแพทย์หรือโทรฉุกเฉินทันที
                </Text>
                
                <TouchableOpacity 
                  style={[styles.emergencyCallBtn, { backgroundColor: '#D32F2F', marginBottom: 12 }]} 
                  onPress={() => simulateCall('1669')}
                >
                  <Text style={styles.emergencyCallBtnText}>📞 โทรฉุกเฉิน 1669</Text>
                </TouchableOpacity>

                {caregiverPhone ? (
                  <TouchableOpacity 
                    style={[styles.emergencyCallBtn, { backgroundColor: '#37474F', marginBottom: 12 }]} 
                    onPress={() => simulateCall(caregiverPhone)}
                  >
                    <Text style={styles.emergencyCallBtnText}>📞 โทรหาลูกหลาน ({caregiverPhone})</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity style={styles.emergencyCancelBtn} onPress={stopAlertSimulation}>
                  <Text style={styles.emergencyCancelBtnText}>หยุดการจำลอง</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBC02D',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  yellowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FBC02D',
    borderBottomWidth: 4,
    borderColor: '#000',
    paddingHorizontal: 16,
    height: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTime: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  headerBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  iconBtn: {
    padding: 4,
  },
  textBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  statusBanner: {
    backgroundColor: '#FFFDE7',
    borderBottomWidth: 4,
    borderColor: '#000',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 104,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#000',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 21,
    color: '#000',
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '700',
    marginTop: 4,
  },
  boldText: {
    fontWeight: '900',
  },
  
  // Spacing Challenge Container
  challengeContainer: {
    backgroundColor: '#E0F7FA',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 20,
    boxShadow: '4px 4px 0px #000',
    margin: 16,
    padding: 16,
    gap: 10,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#006064',
  },
  challengeDesc: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004D40',
    lineHeight: 22,
  },
  progressBarWrapper: {
    backgroundColor: '#B2EBF2',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 10,
    height: 18,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    backgroundColor: '#00B8D4',
    height: '100%',
  },
  timeLeftText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#006064',
    textAlign: 'center',
    marginVertical: 4,
  },
  waterBox: {
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#006064',
    paddingTop: 10,
  },
  waterTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#006064',
  },
  dropsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  dropIcon: {
    fontSize: 34,
  },
  dropInactive: {
    opacity: 0.25,
  },
  challengeControls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  recordWaterBtn: {
    flex: 1.5,
    backgroundColor: '#00838F',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 0px #000',
  },
  recordWaterBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  speedBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 0px #000',
  },
  speedBtnActive: {
    backgroundColor: '#FFEB3B',
  },
  speedBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  successText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderColor: '#2E7D32',
    lineHeight: 20,
    marginBottom: 10,
  },
  finishChallengeBtn: {
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
  },
  finishChallengeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },

  menuContainer: {
    padding: 16,
    gap: 16,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  neoBtn: {
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '4px 4px 0px #000',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  btnRed: {
    backgroundColor: '#FF5252',
    height: 140,
    flexDirection: 'row',
    gap: 16,
  },
  whiteIconCard: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  btnRedText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 32,
  },
  btnYellow: {
    backgroundColor: '#FFEB3B',
    height: 120,
    gap: 8,
  },
  yellowBtnIcon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
  },
  btnYellowText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  },
  btnPurple: {
    backgroundColor: '#9C27B0',
    height: 120,
    gap: 8,
  },
  purpleBtnIcon: {
    marginBottom: 4,
  },
  btnPurpleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  btnOrange: {
    backgroundColor: '#FF9800',
    height: 64,
    borderRadius: 12,
    marginBottom: 16,
    maxWidth: 468,
    alignSelf: 'center',
    width: '100%',
  },
  btnOrangeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  

  mirrorContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  btnBlue: {
    backgroundColor: '#2196F3',
    height: 56,
    borderRadius: 12,
    width: '100%',
    boxShadow: '3px 3px 0px #000',
  },
  btnBlueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  syncBadge: {
    backgroundColor: '#FFFDE7',
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#444',
  },
  syncCode: {
    color: '#F44336',
    fontSize: 16,
  },

  
  // Custom Alert & Call popup styles
  alertModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
  emergencyCallCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#B71C1C',
    boxShadow: '6px 6px 0px #B71C1C',
  },
  sirenWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFCDD2',
    borderWidth: 3,
    borderColor: '#B71C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sirenIcon: {
    fontSize: 48,
  },
  emergencyCallTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#B71C1C',
  },
  dialNumbers: {
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  dialLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  dialValue: {
    color: '#B71C1C',
    fontSize: 16,
    fontWeight: '900',
  },
  dialWarning: {
    fontSize: 13,
    fontWeight: '800',
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
  },
  hangUpBtn: {
    backgroundColor: '#D32F2F',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
  },
  hangUpBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
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
  
  // Water Alert Styles
  waterAlertCard: {
    backgroundColor: '#E0F7FA',
    borderColor: '#006064',
    boxShadow: '6px 6px 0px #006064',
  },
  waterWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B2EBF2',
    borderWidth: 3,
    borderColor: '#006064',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterIcon: {
    fontSize: 44,
  },
  waterAlertTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#006064',
    textAlign: 'center',
  },
  waterAlertMessage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#004D40',
    textAlign: 'center',
    lineHeight: 24,
  },
  waterOkBtn: {
    backgroundColor: '#00ACC1',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
    marginTop: 8,
  },
  waterOkBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },

  // Confirm Alert Styles
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 0px #000',
  },
  btnCancel: {
    backgroundColor: '#ECEFF1',
  },
  btnCancelText: {
    color: '#37474F',
    fontSize: 16,
    fontWeight: '900',
  },
  btnConfirm: {
    backgroundColor: '#D32F2F',
  },
  btnConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  logoutBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#B71C1C',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    boxShadow: '1.5px 1.5px 0px #B71C1C',
  },
  logoutBtnText: {
    color: '#B71C1C',
    fontWeight: '900',
  },
  simChoiceBtn: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    boxShadow: '2px 2px 0px #000',
  },
  simChoiceBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
  },
  linePopup: {
    position: 'absolute',
    top: 50,
    left: '5%',
    width: '90%',
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#06C755',
    borderRadius: 16,
    padding: 12,
    zIndex: 99999,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.15)',
  },
  linePopupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06C755',
    marginHorizontal: -12,
    marginTop: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  linePopupTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },
  linePopupSubtitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  linePopupTime: {
    color: '#FFF',
    fontSize: 11,
    opacity: 0.8,
  },
  linePopupBody: {
    paddingVertical: 10,
  },
  lineBubble: {
    backgroundColor: '#06C755',
    borderRadius: 14,
    borderTopLeftRadius: 0,
    padding: 10,
    maxWidth: '85%',
  },
  lineBubbleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  lineBubbleAuthor: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  linePopupBtn: {
    backgroundColor: '#06C755',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
    boxShadow: '1.5px 1.5px 0px #000',
  },
  linePopupBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  flashBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99999,
  },
  flashBannerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
    marginRight: 8,
  },
  flashBannerBtn: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    boxShadow: '1.5px 1.5px 0px #000',
  },
  flashBannerBtnText: {
    color: '#FF6D00',
    fontWeight: '800',
    fontSize: 13,
  },
  emergencyModalBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 999999,
  },
  sirenIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#FFCDD2',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '2px 2px 0px #000',
  },
  emergencyCallBtn: {
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
  },
  emergencyCallBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  emergencyCancelBtn: {
    backgroundColor: '#ECEFF1',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 12,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 0px #000',
    marginTop: 6,
  },
  emergencyCancelBtnText: {
    color: '#37474F',
    fontSize: 15,
    fontWeight: '800',
  },
});
