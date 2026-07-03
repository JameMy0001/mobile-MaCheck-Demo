import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Modal, Image, TextInput } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { getActivityLogs, clearActivityLogs, ActivityLog, getRemoteProfile, getRemoteCabinet, getRemoteLogs, sendRemoteNudge, syncCabinetWithBackend } from '../api';
import { useSound } from '@/hooks/use-sound';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useCustomAlert } from '@/hooks/use-custom-alert';
import { useAppStore } from '../store/useAppStore';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { SeniorColors } from '@/constants/senior-theme';

export default function CaregiverScreen() {
  const router = useRouter();
  
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);
  const logs = useAppStore((state) => state.logs);

  const { doctorMode } = useDoctorMode();
  const { fontOffset } = useFontSize();
  const { handleSpeak } = useSound();

  // Caregiver Remote Tracking states
  const [targetPhone, setTargetPhone] = useState('');
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [remoteProfile, setRemoteProfile] = useState<any>(null);
  const [remoteCabinet, setRemoteCabinet] = useState<any[]>([]);
  const [remoteLogs, setRemoteLogs] = useState<ActivityLog[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  const { customAlert, setCustomAlert } = useCustomAlert();

  const navigation = useNavigation();

  useEffect(() => {
    handleSpeak('ยินดีต้อนรับเข้าสู่หน้าจอลูกหลานเพื่อติดตามอาการค่ะ');
  }, []);

  const loadData = async () => {};

  const handleClearLogs = () => {
    setCustomAlert({
      visible: true,
      title: 'ล้างประวัติกิจกรรม',
      message: 'คุณตา/ลูกหลานต้องการล้างประวัติกิจกรรมทั้งหมดใช่ไหมคะ?',
      type: 'confirm',
      onConfirm: async () => {
        await useAppStore.getState().clearLogs();
        handleSpeak('ล้างประวัติกิจกรรมเรียบร้อยแล้วค่ะ');
      }
    });
  };

  const connectRemote = async () => {
    const trimmed = targetPhone.trim();
    if (!trimmed || trimmed.length < 9) {
      setCustomAlert({
        visible: true,
        title: 'เบอร์โทรไม่ถูกต้อง',
        message: 'กรุณากรอกเบอร์โทรคุณตา 10 หลักให้ถูกต้องค่ะ',
        type: 'warning'
      });
      handleSpeak('กรุณากรอกเบอร์โทรศัพท์ของคุณตาให้ถูกต้องค่ะ');
      return;
    }

    setIsLoadingRemote(true);
    handleSpeak('กำลังเชื่อมโยงข้อมูลกับคลาวด์ของคุณตาค่ะ');
    try {
      const remoteProf = await getRemoteProfile(trimmed);
      if (!remoteProf) {
        setCustomAlert({
          visible: true,
          title: 'ไม่พบผู้ป่วย',
          message: `ไม่พบข้อมูลผู้ป่วยที่ใช้เบอร์โทร "${trimmed}" ในฐานข้อมูลคลาวด์ค่ะ คุณตาได้เปิดเน็ตหรือลงทะเบียนหรือยังคะ?`,
          type: 'error'
        });
        handleSpeak('ไม่พบข้อมูลคุณตาในระบบค่ะ');
        setIsLoadingRemote(false);
        return;
      }

      // ดึงข้อมูลอื่น ๆ
      const cabinetMeds = await getRemoteCabinet(trimmed);
      const activityLogs = await getRemoteLogs(trimmed);

      setRemoteProfile(remoteProf);
      setRemoteCabinet(cabinetMeds);
      setRemoteLogs(activityLogs);
      setIsRemoteConnected(true);

      setCustomAlert({
        visible: true,
        title: 'เชื่อมต่อสำเร็จ 🟢',
        message: `เชื่อมโยงข้อมูลคลาวด์ของคุณตา "${remoteProf.name}" เรียบร้อยแล้วค่ะ ลูกหลานสามารถสอดส่องและส่งสะกิดเตือนได้เลยนะคะ`,
        type: 'success'
      });
      handleSpeak(`เชื่อมต่อระบบติดตามคุณตา ${remoteProf.name} สำเร็จเรียบร้อยแล้วค่ะ`);
    } catch (err) {
      console.error(err);
      handleSpeak('การเชื่อมต่อกับระบบคลาวด์ขัดข้องค่ะ');
    } finally {
      setIsLoadingRemote(false);
    }
  };

  const disconnectRemote = () => {
    setIsRemoteConnected(false);
    setRemoteProfile(null);
    setRemoteCabinet([]);
    setRemoteLogs([]);
    setTargetPhone('');
    handleSpeak('ยกเลิกการติดตามทางไกลแล้วค่ะ');
  };

  const triggerRemoteNudge = async (type: string, label: string, customText?: string) => {
    if (!remoteProfile) return;
    
    let text = customText || '';
    if (!text) {
      if (type === 'med') {
        text = '🔔 ถึงเวลากินยาแล้วครับคุณตา! อย่าลืมกินยาประจำตัวด้วยนะครับ ลูกหลานส่งสัญญาณสะกิดมาจ้า';
      } else if (type === 'water') {
        text = '💧 คุณตาครับ ดื่มน้ำสักแก้วนะครับ ร่างกายจะได้สดชื่น ลูกหลานส่งสัญญาณเตือนมาจ้า';
      }
    }

    const success = await sendRemoteNudge(remoteProfile.phone, type, text);
    if (success) {
      setCustomAlert({
        visible: true,
        title: 'ส่งสัญญาณสะกิดสำเร็จ',
        message: `ส่งสัญญาณสะกิดแบบ "${label}" ไปที่เครื่องของคุณตาเรียบร้อยแล้วค่ะ เครื่องคุณตาจะดังเตือนทันที!`,
        type: 'success'
      });
      handleSpeak(`ส่งสัญญาณเตือน ${label} เรียบร้อยแล้วค่ะ`);
      if (customText) setMessageInput('');
    } else {
      setCustomAlert({
        visible: true,
        title: 'ส่งล้มเหลว',
        message: 'ไม่สามารถส่งสัญญาณสะกิดได้เนื่องจากระบบคลาวด์ขัดข้องค่ะ',
        type: 'error'
      });
      handleSpeak('ระบบขัดข้องไม่สามารถส่งสัญญาณได้ค่ะ');
    }
  };

  const remoteDeleteMed = async (medId: string, medName: string) => {
    if (!remoteProfile) return;
    
    setCustomAlert({
      visible: true,
      title: 'ยืนยันลบยาระยะไกล',
      message: `คุณต้องการลบยา "${medName}" ออกจากตู้ยาของคุณตาจากระยะไกลใช่ไหมคะ? (ข้อมูลจะอัปเดตไปที่เครื่องคุณตาเมื่อคุณตาเชื่อมต่ออินเทอร์เน็ต)`,
      type: 'confirm',
      onConfirm: async () => {
        const updated = remoteCabinet.filter(m => m.medId !== medId && m.id !== medId);
        setRemoteCabinet(updated);
        // แปลงฟอร์แมตเพื่อส่งขึ้น Supabase
        const payload = updated.map(m => ({
          med_name: m.name,
          med_id: m.medId || m.name
        }));
        await syncCabinetWithBackend(remoteProfile.phone, payload);
        handleSpeak(`ลบยา ${medName} ออกจากตู้ยาคุณตาทางไกลเรียบร้อยแล้วค่ะ`);
      }
    });
  };

  const remoteAddMed = async (medName: string, medId?: string) => {
    if (!remoteProfile) return;
    const name = medName.trim();
    if (!name) return;

    // เช็กยาซ้ำ
    if (remoteCabinet.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      setCustomAlert({
        visible: true,
        title: 'ยาซ้ำในตู้ยาคุณตา',
        message: `ยา "${name}" มีอยู่ในตู้ยาคุณตาเรียบร้อยแล้วค่ะ`,
        type: 'warning'
      });
      return;
    }

    const updated = [...remoteCabinet, {
      id: Date.now().toString(),
      name,
      medId: medId || name
    }];
    setRemoteCabinet(updated);

    // ส่งขึ้นหลังบ้าน
    const payload = updated.map(m => ({
      med_name: m.name,
      med_id: m.medId || m.name
    }));
    await syncCabinetWithBackend(remoteProfile.phone, payload);
    handleSpeak(`เพิ่มยา ${name} เข้าตู้ยาคุณตาทางไกลเรียบร้อยแล้วค่ะ`);
  };

  const getDiseaseThName = (d: string) => {
    const mapping: { [key: string]: string } = {
      hypertension: 'ความดันสูง',
      diabetes: 'เบาหวาน',
      heart: 'โรคหัวใจ',
      lipid: 'ไขมันในเลือดสูง',
      kidney: 'โรคไต',
      stomach: 'โรคกระเพาะ',
      liver: 'โรคตับ'
    };
    return mapping[d] || d;
  };

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <View style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}>
        
        {/* Top Info Header */}
        <View style={[styles.syncHeader, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
          <Feather name="cloud-lightning" size={28} color={doctorMode ? '#000' : SeniorColors.primary} />
          <Text style={[styles.syncTitle, doctorMode && { color: '#000' }]}>
            สถานะ: <Text style={[styles.syncStatus, doctorMode && { color: '#000' }]}>
              {isRemoteConnected ? `ซิงค์คลาวด์เบอร์ ${remoteProfile.phone}` : 'กำลังติดตามการซิงค์ออฟไลน์'}
            </Text>
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Cloud room sync Connection Card */}
          <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            <View style={styles.cardHeader}>
              <Feather name="cloud" size={24} color="#000" />
              <Text style={styles.cardTitle}>เชื่อมต่อติดตามระยะไกล (Cloud Sync)</Text>
            </View>
            {!isRemoteConnected ? (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 14 + fontOffset, fontWeight: '700', color: '#333' }}>
                  ป้อนเบอร์โทรศัพท์หรือรหัสเชื่อมต่อคุณตาคุณยาย เพื่อดึงข้อมูลตู้ยาและประวัติกิจกรรมแบบเรียลไทม์ข้ามอุปกรณ์:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.remoteInput, { fontSize: 16 + fontOffset }]}
                    placeholder="กรอกเบอร์โทรคุณตา เช่น 0812345678"
                    keyboardType="phone-pad"
                    value={targetPhone}
                    onChangeText={setTargetPhone}
                  />
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={connectRemote}
                    disabled={isLoadingRemote}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 + fontOffset }}>
                      {isLoadingRemote ? 'รอ...' : 'เชื่อมต่อ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16 + fontOffset, fontWeight: '800', color: doctorMode ? '#000' : SeniorColors.success }}>
                    ซิงค์กับเครื่องคุณตา &quot;{remoteProfile.name}&quot; สำเร็จ
                  </Text>
                  <TouchableOpacity
                    style={styles.disconnectBtn}
                    onPress={disconnectRemote}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 + fontOffset }}>
                      ตัดการเชื่อมต่อ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Patient Card */}
          <View style={[styles.card, styles.profileCard, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="user-alt" size={24} color="#000" />
              <Text style={styles.cardTitle}>ข้อมูลคุณตา/คุณยาย</Text>
            </View>
            {isRemoteConnected ? (
              // Remote Profile Display
              <View style={styles.profileDetails}>
                <View style={styles.profileItemRow}>
                  <Feather name="user" size={18} color="#000" />
                  <Text style={styles.profileText}> ชื่อ: {remoteProfile.name} (คุณตาทางไกล)</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="phone" size={18} color="#000" />
                  <Text style={styles.profileText}> สายด่วน: {remoteProfile.phone}</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="key" size={18} color="#000" />
                  <Text style={styles.profileText}> รหัสติดตาม (Cloud Sync): <Text style={[styles.syncCode, doctorMode && { color: '#000' }]}>{remoteProfile.syncCode}</Text></Text>
                </View>
                <View style={styles.profileItemRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={styles.profileText}> โรคประจำตัว:</Text>
                </View>
                <View style={styles.badgeContainer}>
                  {remoteProfile.diseases && remoteProfile.diseases.length > 0 ? (
                    remoteProfile.diseases.map((d: string) => (
                      <View key={d} style={[styles.badge, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}>
                        <Text style={[styles.badgeText, doctorMode && { color: '#000' }]}>{getDiseaseThName(d)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>ไม่มีโรคประจำตัวที่ระบุ</Text>
                  )}
                  {remoteProfile.otherDiseases ? (
                    remoteProfile.otherDiseases.split(',').map((d: string) => (
                      <View key={d.trim()} style={[styles.badge, { backgroundColor: '#E0F2F1' }, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}>
                        <Text style={[styles.badgeText, doctorMode && { color: '#000' }]}>{d.trim()}</Text>
                      </View>
                    ))
                  ) : null}
                </View>
                
                {remoteProfile.allergies && remoteProfile.allergies.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.profileItemRow}>
                      <FontAwesome5 name="exclamation-triangle" size={16} color="#000" />
                      <Text style={styles.profileText}> ประวัติแพ้ยาคุณตา:</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      {remoteProfile.allergies.map((a: any) => (
                        <View key={a.medId} style={[styles.badge, { backgroundColor: a.severity === 'severe' ? '#FFEBEE' : '#FFF3E0', borderColor: a.severity === 'severe' ? '#FFCDD2' : '#FFE0B2' }]}>
                          <Text style={[styles.badgeText, { color: a.severity === 'severe' ? '#C62828' : '#E65100' }]}>
                            {a.medId === 'aspirin' ? 'ยาแก้ปวดข้อ (Aspirin)' : 
                             a.medId === 'ibuprofen' ? 'ยาแก้ปวดข้อ (Ibuprofen)' :
                             a.medId === 'simvastatin' ? 'ยาลดไขมัน (Simvastatin)' :
                             a.medId === 'warfarin' ? 'ยาละลายลิ่มเลือด (Warfarin)' :
                             a.medId === 'metformin' ? 'ยาเบาหวาน (Metformin)' :
                             a.medId === 'amlodipine' ? 'ยาลดความดัน (Amlodipine)' :
                             a.medId === 'lisinopril' ? 'ยาลดความดัน (Lisinopril)' :
                             a.medId === 'digoxin' ? 'ยาคุมชีพจร (Digoxin)' : a.medId}
                            ({a.severity === 'severe' ? 'รุนแรง' : 'ปานกลาง'})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : profile ? (
              // Local Profile Display
              <View style={styles.profileDetails}>
                <View style={styles.profileItemRow}>
                  <Feather name="user" size={18} color="#000" />
                  <Text style={styles.profileText}> ชื่อ: {profile.name}</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="phone" size={18} color="#000" />
                  <Text style={styles.profileText}> สายด่วน: {profile.phone}</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="key" size={18} color="#000" />
                  <Text style={styles.profileText}> รหัสติดตาม (Cloud Sync): <Text style={[styles.syncCode, doctorMode && { color: '#000' }]}>{profile.syncCode}</Text></Text>
                </View>
                <View style={styles.profileItemRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={styles.profileText}> โรคประจำตัว:</Text>
                </View>
                <View style={styles.badgeContainer}>
                  {profile.diseases && profile.diseases.length > 0 ? (
                    profile.diseases.map((d: string) => (
                      <View key={d} style={[styles.badge, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}>
                        <Text style={[styles.badgeText, doctorMode && { color: '#000' }]}>{getDiseaseThName(d)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>ไม่มีโรคประจำตัวที่ระบุ</Text>
                  )}
                  {profile.otherDiseases ? (
                    profile.otherDiseases.split(',').map((d: string) => (
                      <View key={d.trim()} style={[styles.badge, { backgroundColor: '#E0F2F1' }, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}>
                        <Text style={[styles.badgeText, doctorMode && { color: '#000' }]}>{d.trim()}</Text>
                      </View>
                    ))
                  ) : null}
                </View>

                {profile.allergies && profile.allergies.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.profileItemRow}>
                      <FontAwesome5 name="exclamation-triangle" size={16} color="#000" />
                      <Text style={styles.profileText}> ประวัติแพ้ยา:</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      {profile.allergies.map((a: any) => (
                        <View key={a.medId} style={[styles.badge, { backgroundColor: a.severity === 'severe' ? '#FFEBEE' : '#FFF3E0', borderColor: a.severity === 'severe' ? '#FFCDD2' : '#FFE0B2' }]}>
                          <Text style={[styles.badgeText, { color: a.severity === 'severe' ? '#C62828' : '#E65100' }]}>
                            {a.medId === 'aspirin' ? 'ยาแก้ปวดข้อ (Aspirin)' : 
                             a.medId === 'ibuprofen' ? 'ยาแก้ปวดข้อ (Ibuprofen)' :
                             a.medId === 'simvastatin' ? 'ยาลดไขมัน (Simvastatin)' :
                             a.medId === 'warfarin' ? 'ยาละลายลิ่มเลือด (Warfarin)' :
                             a.medId === 'metformin' ? 'ยาเบาหวาน (Metformin)' :
                             a.medId === 'amlodipine' ? 'ยาลดความดัน (Amlodipine)' :
                             a.medId === 'lisinopril' ? 'ยาลดความดัน (Lisinopril)' :
                             a.medId === 'digoxin' ? 'ยาคุมชีพจร (Digoxin)' : a.medId}
                            ({a.severity === 'severe' ? 'รุนแรง' : 'ปานกลาง'})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                
                {/* Switch User Button */}
                <TouchableOpacity 
                  style={[styles.switchUserBtn, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}
                  onPress={() => {
                    handleSpeak('พาไปหน้าลงทะเบียนและสลับข้อมูลผู้ป่วยย้อนหลังค่ะ');
                    router.push('/register');
                  }}
                >
                  <Feather name="users" size={16} color="#000" style={{ marginRight: 6 }} />
                  <Text style={styles.switchUserBtnText}>สลับผู้ป่วย / ลงทะเบียนเพิ่ม</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.noDataText}>ยังไม่ได้ลงทะเบียนคนไข้ในระบบค่ะ</Text>
            )}
          </View>

          {/* 🔔 แผงเตือนสะกิดคุณตาระยะไกล */}
          {isRemoteConnected && (
            <View style={[styles.card, styles.nudgeCard, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
              <View style={[styles.cardHeader, { borderColor: doctorMode ? '#000' : SeniorColors.warning }]}>
                <FontAwesome5 name="bell" size={24} color="#000" />
                <Text style={styles.cardTitle}>แผงสะกิดระยะไกล (Cloud Nudge)</Text>
              </View>
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14 + fontOffset, fontWeight: '700', color: '#555' }}>
                  ส่งสัญญาณสะกิดแบบเร่งด่วน ไปส่งเสียงพูดและป๊อปอัปแจ้งเตือนที่ตู้ยาของคุณตาทันที:
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={styles.nudgeBtn}
                    onPress={() => triggerRemoteNudge('med', 'เตือนเวลาทานยา')}
                  >
                    <FontAwesome5 name="pills" size={18} color="#000" style={{ marginBottom: 4 }} />
                    <Text style={{ fontWeight: '900', fontSize: 13 + fontOffset }}>สะกิดกินยา</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nudgeBtn, styles.nudgeWaterBtn]}
                    onPress={() => triggerRemoteNudge('water', 'สะกิดจิบน้ำ')}
                  >
                    <FontAwesome5 name="tint" size={18} color="#000" style={{ marginBottom: 4 }} />
                    <Text style={{ fontWeight: '900', fontSize: 13 + fontOffset }}>สะกิดจิบน้ำ</Text>
                  </TouchableOpacity>
                </View>

                {/* Send Custom text message */}
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 14 + fontOffset, fontWeight: '800', color: '#333', marginBottom: 6 }}>
                    💬 ส่งข้อความสั้นเตือนใจคุณตา:
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.remoteInput, { fontSize: 14 + fontOffset }]}
                      placeholder="เช่น วันนี้หลานเป็นห่วง อย่าลืมกินยานะครับ..."
                      value={messageInput}
                      onChangeText={setMessageInput}
                    />
                    <TouchableOpacity
                      style={styles.sendBtn}
                      onPress={() => triggerRemoteNudge('message', 'ส่งข้อความเตือนใจ', messageInput)}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 + fontOffset }}>ส่ง</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remotely add medication */}
                <View style={{ marginTop: 8, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#FFB300', paddingTop: 12 }}>
                  <Text style={{ fontSize: 14 + fontOffset, fontWeight: '800', color: '#333', marginBottom: 6 }}>
                    ➕ เพิ่มรายการยาลงตู้ยาคุณตาทางไกล:
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.remoteInput, { fontSize: 14 + fontOffset }]}
                      placeholder="ป้อนชื่อยาแล้วกดตกลงเพื่อบันทึกแทน"
                      onSubmitEditing={(e) => {
                        remoteAddMed(e.nativeEvent.text);
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Current Cabinet Medicines */}
          <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="pills" size={24} color="#000" />
              <Text style={styles.cardTitle}>
                {isRemoteConnected ? `รายการยาในตู้ยาคุณตา (${remoteCabinet.length})` : `รายการยาในตู้ยาล่าสุด (${cabinet.length})`}
              </Text>
            </View>
            {(isRemoteConnected ? remoteCabinet : cabinet).length > 0 ? (
              <View style={styles.medList}>
                {(isRemoteConnected ? remoteCabinet : cabinet).map((med: any) => (
                  <View key={med.id} style={[styles.medItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Image 
                        source={require('../../assets/images/icons/icon_pill.png')} 
                        style={{ width: 22, height: 22, resizeMode: 'contain' }} 
                      />
                      <Text style={styles.medItemText}>{med.name}</Text>
                    </View>
                    {isRemoteConnected && (
                      <TouchableOpacity onPress={() => remoteDeleteMed(med.id || med.medId, med.name)}>
                        <Feather name="trash-2" size={20} color="#D32F2F" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>
                {isRemoteConnected ? 'ไม่มีรายการยาในตู้ยาคุณตาบนคลาวด์ขณะนี้ค่ะ' : 'ไม่มีรายการยาในตู้ยาของคุณตาขณะนี้ค่ะ'}
              </Text>
            )}
          </View>

          {/* Logs of Activities */}
          <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FontAwesome5 name="history" size={24} color="#000" />
                <Text style={styles.cardTitle}>
                  {isRemoteConnected ? 'ประวัติกิจกรรมคุณตาทางไกล' : 'บันทึกกิจกรรมล่าสุด'}
                </Text>
              </View>
              {!isRemoteConnected && logs.length > 0 && (
                <TouchableOpacity style={[styles.clearBtn, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]} onPress={handleClearLogs}>
                  <Text style={[styles.clearBtnText, doctorMode && { color: '#000' }]}>ล้าง</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {(isRemoteConnected ? remoteLogs : logs).length > 0 ? (
              <View style={styles.logList}>
                {(isRemoteConnected ? remoteLogs : logs).map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Feather name="clock" size={14} color="#757575" />
                      <Text style={styles.logTime}>{log.timestamp}</Text>
                    </View>
                    <Text style={styles.logText}>{log.text}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>
                {isRemoteConnected ? 'ยังไม่มีประวัติกิจกรรมของคุณตาบนคลาวด์ค่ะ' : 'ยังไม่มีบันทึกประวัติกิจกรรมของคุณตาค่ะ'}
              </Text>
            )}
          </View>

        </ScrollView>

        {/* Custom Alert Modal */}
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

      </View>
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
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SeniorColors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
    gap: 12,
  },
  syncTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  syncStatus: {
    color: SeniorColors.primary,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 20,
    boxShadow: '0px 8px 22px rgba(31, 122, 92, 0.10)',
    padding: 16,
    gap: 12,
  },
  profileCard: {
    backgroundColor: SeniorColors.primarySoft,
    borderColor: SeniorColors.primary,
  },
  nudgeCard: {
    backgroundColor: SeniorColors.warningSoft,
    borderColor: SeniorColors.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: SeniorColors.text,
  },
  profileDetails: {
    gap: 8,
  },
  profileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  profileText: {
    fontSize: 17,
    fontWeight: '700',
    color: SeniorColors.text,
  },
  syncCode: {
    color: SeniorColors.danger,
    fontWeight: '900',
    fontSize: 18,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  noDataText: {
    fontSize: 16,
    color: SeniorColors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
  },
  remoteInput: {
    flex: 1,
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: '700',
    color: SeniorColors.text,
    minHeight: 56,
  },
  connectBtn: {
    backgroundColor: SeniorColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  disconnectBtn: {
    backgroundColor: SeniorColors.danger,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  nudgeBtn: {
    flex: 1,
    backgroundColor: SeniorColors.warningSoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.warning,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
  },
  nudgeWaterBtn: {
    backgroundColor: SeniorColors.infoSoft,
    borderColor: SeniorColors.info,
  },
  sendBtn: {
    backgroundColor: SeniorColors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    minHeight: 56,
  },
  medList: {
    gap: 8,
  },
  medItem: {
    backgroundColor: SeniorColors.successSoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 56,
  },
  medItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: SeniorColors.text,
  },
  logList: {
    gap: 12,
  },
  logItem: {
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
    paddingBottom: 10,
  },
  logTime: {
    fontSize: 13,
    fontWeight: '700',
    color: SeniorColors.textSecondary,
  },
  logText: {
    fontSize: 16,
    fontWeight: '700',
    color: SeniorColors.text,
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: SeniorColors.danger,
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  
  // Custom Alert Styles
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
  switchUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SeniorColors.primarySoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
    minHeight: 56,
  },
  switchUserBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: SeniorColors.primaryDark,
  },
});
