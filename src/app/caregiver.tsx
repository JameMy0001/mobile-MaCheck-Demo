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
import { useTranslation } from '../constants/translations';
import { SeniorColors } from '@/constants/senior-theme';

export default function CaregiverScreen() {
  const router = useRouter();
  
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);
  const logs = useAppStore((state) => state.logs);

  const { doctorMode } = useDoctorMode();
  const { fontOffset } = useFontSize();
  const { handleSpeak } = useSound();
  const { t, language } = useTranslation();

  const navigation = useNavigation();

  // Caregiver Remote Tracking states
  const [targetPhone, setTargetPhone] = useState('');
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [remoteProfile, setRemoteProfile] = useState<any>(null);
  const [remoteCabinet, setRemoteCabinet] = useState<any[]>([]);
  const [remoteLogs, setRemoteLogs] = useState<ActivityLog[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  const { customAlert, setCustomAlert } = useCustomAlert();

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
      hypertension: language === 'th' ? 'ความดันสูง' : 'Hypertension',
      diabetes: language === 'th' ? 'เบาหวาน' : 'Diabetes',
      heart: language === 'th' ? 'โรคหัวใจ' : 'Heart Disease',
      lipid: language === 'th' ? 'ไขมันในเลือดสูง' : 'Hyperlipidemia',
      kidney: language === 'th' ? 'โรคไต' : 'Kidney Disease',
      stomach: language === 'th' ? 'โรคกระเพาะ' : 'Stomach Disease',
      liver: language === 'th' ? 'โรคตับ' : 'Liver Disease'
    };
    return mapping[d] || d;
  };

  const translateMedName = (name: string) => {
    if (language === 'th') return name;
    let translated = name;
    translated = translated.replace(/ยาแก้แพ้เม็ดสีเหลือง \(ลดน้ำมูก \/ แก้แพ้คัน \/ ช่วยให้นอนหลับง่าย\)/g, 'Yellow Allergy Pill (CPM / Anti-histamine)');
    translated = translated.replace(/ยาแก้ปวดอักเสบไอบูโพรเฟน \(แก้ปวดกล้ามเนื้อ\/กระดูกอักเสบชนิดรุนแรง\)/g, 'Ibuprofen (NSAIDs Pain Reliever)');
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด \(Warfarin\)/g, 'Blood Thinner (Warfarin)');
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด/g, 'Blood Thinner');
    translated = translated.replace(/ยาลดไขมัน \(Simvastatin\)/g, 'Cholesterol Lowering (Simvastatin)');
    translated = translated.replace(/ยาลดความดัน \(Amlodipine\)/g, 'Hypertension Med (Amlodipine)');
    translated = translated.replace(/ยาลดความดัน \(Lisinopril\)/g, 'Hypertension Med (Lisinopril)');
    translated = translated.replace(/ยาโรคเบาหวาน \(Metformin\)/g, 'Diabetes Med (Metformin)');
    translated = translated.replace(/ยาพาราเซตามอล/g, 'Paracetamol');
    translated = translated.replace(/ยาแก้ปวดข้อ/g, 'Pain Reliever');
    translated = translated.replace(/ยาโรคหัวใจ \(Digoxin\)/g, 'Heart Disease Med (Digoxin)');
    return translated;
  };

  const translateLogText = (text: string) => {
    if (language === 'th') return text;
    let translated = text;
    translated = translated.replace(/เช็กของแสลง:/g, 'Checked food clash:');
    translated = translated.replace(/\(ปลอดภัย ทานได้\)/g, '(Safe to consume)');
    translated = translated.replace(/\(พบจุดขัดกันความเสี่ยงสูงระดับ: red\)/g, '(Found high risk interaction: red)');
    translated = translated.replace(/\(พบจุดขัดกันความเสี่ยงสูงระดับ: yellow\)/g, '(Found warning interaction: yellow)');
    translated = translated.replace(/\(ไม่มีประวัติขัดกับคุณตา - ทานได้\)/g, '(No clashes - Safe to consume)');
    translated = translated.replace(/คุณตาสแกนทดสอบกรณีตัวอย่าง:/g, 'Simulated scan test case:');
    translated = translated.replace(/ผลลัพธ์:/g, 'Result:');
    translated = translated.replace(/คุณตากดปุ่มเรียกสายด่วนฉุกเฉิน:/g, 'Pressed emergency call speed-dial:');
    translated = translated.replace(/ได้รับสัญญาณสะกิดระยะไกลจากลูกหลาน:/g, 'Received remote caregiver nudge:');
    translated = translated.replace(/คุณตากดบันทึกจิบน้ำสะสม แก้วที่:/g, 'Grandpa logged water intake, cup:');
    translated = translated.replace(/คุณตาสิ้นสุดภารกิจความปลอดภัยเว้นระยะยา:/g, 'Grandpa finished Spacing Challenge for:');
    translated = translated.replace(/เปิดเครื่องจำลองระดับแจ้งเตือน \(Alert Simulator\)/g, 'Opened Alert Simulator Panel');
    translated = translated.replace(/จำลองแจ้งเตือนระดับ 1: LINE Notification/g, 'Simulated Level 1 Alert: LINE Notification');
    translated = translated.replace(/จำลองแจ้งเตือนระดับ 2: แบนเนอร์กระพริบ \+ เสียงเตือนซ้ำ/g, 'Simulated Level 2 Alert: Flashing banner + repeat sound');
    translated = translated.replace(/จำลองแจ้งเตือนระดับ 3: ไซเรนฉุกเฉิน \+ โทร 1669/g, 'Simulated Level 3 Alert: Emergency siren + call 1669');
    translated = translated.replace(/หยุดการจำลองแจ้งเตือนทั้งหมด/g, 'Stopped all alert simulations');
    translated = translated.replace(/ลงทะเบียนผู้ป่วยใหม่:/g, 'Registered new patient:');
    translated = translated.replace(/อัปเดตข้อมูลการตั้งค่าและประวัติคุณตา:/g, 'Updated settings and medical history:');
    translated = translated.replace(/เข้าสู่ระบบในชื่อผู้ใช้:/g, 'Logged in as:');
    translated = translated.replace(/คุณตาสแกนเช็กยา:/g, 'Scanned medication:');
    translated = translated.replace(/\(ผลลัพธ์ระดับสี: (.*?)\)/g, '(Color result: $1)');
    translated = translated.replace(/เริ่มชาเลนจ์ความปลอดภัยของยาแก้ปวด:/g, 'Started medicine Spacing Challenge for:');
    translated = translated.replace(/คุณตาเพิ่มยา/g, 'Grandpa added medicine');
    translated = translated.replace(/เข้าตู้ยา/g, 'to cabinet');
    translated = translated.replace(/คุณตาลบยา/g, 'Grandpa deleted medicine');
    translated = translated.replace(/ออกจากตู้ยา/g, 'from cabinet');
    translated = translated.replace(/คุณตาเปิดดูตารางปฏิกิริยายาตีกัน \(Interaction Matrix\)/g, 'Opened Interaction Matrix Grid');
    translated = translated.replace(/เพิ่มข้อมูลยาตัวใหม่ลงฐานข้อมูล:/g, 'Added new medicine to local DB:');
    return translated;
  };

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <View style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}>
        
        {/* Top Info Header */}
        <View style={[styles.syncHeader, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
          <Feather name="cloud-lightning" size={28} color={doctorMode ? '#000' : SeniorColors.primary} />
          <Text style={[styles.syncTitle, doctorMode && { color: '#000' }]}>
            {language === 'th' ? 'สถานะ: ' : 'Status: '}<Text style={[styles.syncStatus, doctorMode && { color: '#000' }]}>
              {isRemoteConnected ? (language === 'th' ? `ซิงค์คลาวด์เบอร์ ${remoteProfile.phone}` : `Synced cloud ${remoteProfile.phone}`) : (language === 'th' ? 'กำลังติดตามการซิงค์ออฟไลน์' : 'Monitoring local offline device')}
            </Text>
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Cloud room sync Connection Card */}
          <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            <View style={styles.cardHeader}>
              <Feather name="cloud" size={24} color="#000" />
              <Text style={styles.cardTitle}>
                {language === 'th' ? 'เชื่อมต่อติดตามระยะไกล (Cloud Sync)' : 'Remote Tracking (Cloud Sync)'}
              </Text>
            </View>
            {!isRemoteConnected ? (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 14 + fontOffset, fontWeight: '700', color: '#333' }}>
                  {language === 'th' ? 'ป้อนเบอร์โทรศัพท์หรือรหัสเชื่อมต่อคุณตาคุณยาย เพื่อดึงข้อมูลตู้ยาและประวัติกิจกรรมแบบเรียลไทม์ข้ามอุปกรณ์:' : 'Enter Grandpas mobile number to pull cabinet and activity logs in real-time across devices:'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.remoteInput, { fontSize: 16 + fontOffset }]}
                    placeholder={language === 'th' ? 'กรอกเบอร์โทรคุณตา เช่น 0812345678' : 'Grandpas phone e.g. 0812345678'}
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
                      {isLoadingRemote ? (language === 'th' ? 'รอ...' : 'Waiting...') : (language === 'th' ? 'เชื่อมต่อ' : 'Connect')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16 + fontOffset, fontWeight: '800', color: doctorMode ? '#000' : SeniorColors.success }}>
                    {language === 'th' ? `ซิงค์กับเครื่องคุณตา "${remoteProfile.name}" สำเร็จ` : `Connected to Grandpa "${remoteProfile.name}" successfully`}
                  </Text>
                  <TouchableOpacity
                    style={styles.disconnectBtn}
                    onPress={disconnectRemote}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 + fontOffset }}>
                      {language === 'th' ? 'ตัดการเชื่อมต่อ' : 'Disconnect'}
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
              <Text style={styles.cardTitle}>
                {language === 'th' ? 'ข้อมูลคุณตา/คุณยาย' : 'Grandpas Profile Details'}
              </Text>
            </View>
            {isRemoteConnected ? (
              // Remote Profile Display
              <View style={styles.profileDetails}>
                <View style={styles.profileItemRow}>
                  <Feather name="user" size={18} color="#000" />
                  <Text style={styles.profileText}> {language === 'th' ? `ชื่อ: ${remoteProfile.name} (คุณตาทางไกล)` : `Name: ${remoteProfile.name} (Remote Grandpa)`}</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="phone" size={18} color="#000" />
                  <Text style={styles.profileText}> {language === 'th' ? `สายด่วน: ${remoteProfile.phone}` : `Caregiver Phone: ${remoteProfile.phone}`}</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="key" size={18} color="#000" />
                  <Text style={styles.profileText}> {language === 'th' ? 'รหัสติดตาม (Cloud Sync): ' : 'Sync Key (Cloud Sync): '}<Text style={[styles.syncCode, doctorMode && { color: '#000' }]}>{remoteProfile.syncCode}</Text></Text>
                </View>
                <View style={styles.profileItemRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={styles.profileText}> {language === 'th' ? 'โรคประจำตัว:' : 'Conditions:'}</Text>
                </View>
                <View style={styles.badgeContainer}>
                  {remoteProfile.diseases && remoteProfile.diseases.length > 0 ? (
                    remoteProfile.diseases.map((d: string) => (
                      <View key={d} style={[styles.badge, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}>
                        <Text style={[styles.badgeText, doctorMode && { color: '#000' }]}>{getDiseaseThName(d)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>{language === 'th' ? 'ไม่มีโรคประจำตัวที่ระบุ' : 'No registered conditions'}</Text>
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
                      <Text style={styles.profileText}> {language === 'th' ? 'ประวัติแพ้ยาคุณตา:' : 'Grandpas Allergies:'}</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      {remoteProfile.allergies.map((a: any) => (
                        <View key={a.medId} style={[styles.badge, { backgroundColor: a.severity === 'severe' ? '#FFEBEE' : '#FFF3E0', borderColor: a.severity === 'severe' ? '#FFCDD2' : '#FFE0B2' }]}>
                          <Text style={[styles.badgeText, { color: a.severity === 'severe' ? '#C62828' : '#E65100' }]}>
                            {a.medId === 'aspirin' ? (language === 'th' ? 'ยาแก้ปวดข้อ (Aspirin)' : 'Aspirin') : 
                             a.medId === 'ibuprofen' ? (language === 'th' ? 'ยาแก้ปวดข้อ (Ibuprofen)' : 'Ibuprofen') :
                             a.medId === 'simvastatin' ? (language === 'th' ? 'ยาลดไขมัน (Simvastatin)' : 'Simvastatin') :
                             a.medId === 'warfarin' ? (language === 'th' ? 'ยาละลายลิ่มเลือด (Warfarin)' : 'Warfarin') :
                             a.medId === 'metformin' ? (language === 'th' ? 'ยาเบาหวาน (Metformin)' : 'Metformin') :
                             a.medId === 'amlodipine' ? (language === 'th' ? 'ยาลดความดัน (Amlodipine)' : 'Amlodipine') :
                             a.medId === 'lisinopril' ? (language === 'th' ? 'ยาลดความดัน (Lisinopril)' : 'Lisinopril') :
                             a.medId === 'digoxin' ? (language === 'th' ? 'ยาคุมชีพจร (Digoxin)' : 'Digoxin') : a.medId}
                            ({a.severity === 'severe' ? (language === 'th' ? 'รุนแรง' : 'Severe') : (language === 'th' ? 'ปานกลาง' : 'Moderate')})
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
                  <Text style={styles.profileText}> {language === 'th' ? `ชื่อ: ${profile.name}` : `Name: ${profile.name}`}</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="phone" size={18} color="#000" />
                  <Text style={styles.profileText}> {language === 'th' ? `สายด่วน: ${profile.phone}` : `Caregiver Phone: ${profile.phone}`}</Text>
                </View>
                <View style={styles.profileItemRow}>
                  <Feather name="key" size={18} color="#000" />
                  <Text style={styles.profileText}> {language === 'th' ? 'รหัสติดตาม (Cloud Sync): ' : 'Sync Key (Cloud Sync): '}<Text style={[styles.syncCode, doctorMode && { color: '#000' }]}>{profile.syncCode}</Text></Text>
                </View>
                <View style={styles.profileItemRow}>
                  <FontAwesome5 name="stethoscope" size={18} color="#000" />
                  <Text style={styles.profileText}> {language === 'th' ? 'โรคประจำตัว:' : 'Conditions:'}</Text>
                </View>
                <View style={styles.badgeContainer}>
                  {profile.diseases && profile.diseases.length > 0 ? (
                    profile.diseases.map((d: string) => (
                      <View key={d} style={[styles.badge, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}>
                        <Text style={[styles.badgeText, doctorMode && { color: '#000' }]}>{getDiseaseThName(d)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>{language === 'th' ? 'ไม่มีโรคประจำตัวที่ระบุ' : 'No registered conditions'}</Text>
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
                      <Text style={styles.profileText}> {language === 'th' ? 'ประวัติแพ้ยา:' : 'Drug Allergy History:'}</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      {profile.allergies.map((a: any) => {
                        const allergyMedLabel = a.medId === 'aspirin' ? (language === 'th' ? 'ยาแก้ปวดข้อ (Aspirin)' : 'Aspirin') :
                                                a.medId === 'ibuprofen' ? (language === 'th' ? 'ยาแก้ปวดข้อ (Ibuprofen)' : 'Ibuprofen') :
                                                a.medId === 'simvastatin' ? (language === 'th' ? 'ยาลดไขมัน (Simvastatin)' : 'Simvastatin') :
                                                a.medId === 'warfarin' ? (language === 'th' ? 'ยาละลายลิ่มเลือด (Warfarin)' : 'Warfarin') :
                                                a.medId === 'metformin' ? (language === 'th' ? 'ยาเบาหวาน (Metformin)' : 'Metformin') :
                                                a.medId === 'amlodipine' ? (language === 'th' ? 'ยาลดความดัน (Amlodipine)' : 'Amlodipine') :
                                                a.medId === 'lisinopril' ? (language === 'th' ? 'ยาลดความดัน (Lisinopril)' : 'Lisinopril') :
                                                a.medId === 'digoxin' ? (language === 'th' ? 'ยาคุมชีพจร (Digoxin)' : 'Digoxin') : a.medId;
                        return (
                          <View key={a.medId} style={[styles.badge, { backgroundColor: a.severity === 'severe' ? '#FFEBEE' : '#FFF3E0', borderColor: a.severity === 'severe' ? '#FFCDD2' : '#FFE0B2' }]}>
                            <Text style={[styles.badgeText, { color: a.severity === 'severe' ? '#C62828' : '#E65100' }]}>
                              {allergyMedLabel} ({a.severity === 'severe' ? (language === 'th' ? 'รุนแรง' : 'Severe') : (language === 'th' ? 'ปานกลาง' : 'Moderate')})
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                
                {/* Switch User Button */}
                <TouchableOpacity 
                  style={[styles.switchUserBtn, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}
                  onPress={() => {
                    handleSpeak(language === 'th' ? 'พาไปหน้าลงทะเบียนและสลับข้อมูลผู้ป่วยย้อนหลังค่ะ' : 'Navigating to profile switcher and registration.');
                    router.push('/register');
                  }}
                >
                  <Feather name="users" size={16} color="#000" style={{ marginRight: 6 }} />
                  <Text style={styles.switchUserBtnText}>
                    {language === 'th' ? 'สลับผู้ป่วย / ลงทะเบียนเพิ่ม' : 'Switch Patient / Register New'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.noDataText}>
                {language === 'th' ? 'ยังไม่ได้ลงทะเบียนคนไข้ในระบบค่ะ' : 'No patient registered on this device yet.'}
              </Text>
            )}
          </View>

          {/* 🔔 แผงเตือนสะกิดคุณตาระยะไกล */}
          {isRemoteConnected && (
            <View style={[styles.card, styles.nudgeCard, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
              <View style={[styles.cardHeader, { borderColor: doctorMode ? '#000' : SeniorColors.warning }]}>
                <FontAwesome5 name="bell" size={24} color="#000" />
                <Text style={styles.cardTitle}>
                  {language === 'th' ? 'แผงสะกิดระยะไกล (Cloud Nudge)' : 'Remote Alerts (Cloud Nudge)'}
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14 + fontOffset, fontWeight: '700', color: '#555' }}>
                  {language === 'th' ? 'ส่งสัญญาณสะกิดแบบเร่งด่วน ไปส่งเสียงพูดและป๊อปอัปแจ้งเตือนที่ตู้ยาของคุณตาทันที:' : 'Send instant audio alerts and nudge popups to Grandpas device immediately:'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={styles.nudgeBtn}
                    onPress={() => triggerRemoteNudge('med', 'เตือนเวลาทานยา')}
                  >
                    <FontAwesome5 name="pills" size={18} color="#000" style={{ marginBottom: 4 }} />
                    <Text style={{ fontWeight: '900', fontSize: 13 + fontOffset }}>
                      {language === 'th' ? 'สะกิดกินยา' : 'Nudge Meds'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nudgeBtn, styles.nudgeWaterBtn]}
                    onPress={() => triggerRemoteNudge('water', 'สะกิดจิบน้ำ')}
                  >
                    <FontAwesome5 name="tint" size={18} color="#000" style={{ marginBottom: 4 }} />
                    <Text style={{ fontWeight: '900', fontSize: 13 + fontOffset }}>
                      {language === 'th' ? 'สะกิดจิบน้ำ' : 'Nudge Water'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Send Custom text message */}
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 14 + fontOffset, fontWeight: '800', color: '#333', marginBottom: 6 }}>
                    {language === 'th' ? '💬 ส่งข้อความสั้นเตือนใจคุณตา:' : '💬 Send a custom reminder message:'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.remoteInput, { fontSize: 14 + fontOffset }]}
                      placeholder={language === 'th' ? 'เช่น วันนี้หลานเป็นห่วง อย่าลืมกินยานะครับ...' : 'e.g., Don\'t forget to take your pills today...'}
                      value={messageInput}
                      onChangeText={setMessageInput}
                    />
                    <TouchableOpacity
                      style={styles.sendBtn}
                      onPress={() => triggerRemoteNudge('message', 'ส่งข้อความเตือนใจ', messageInput)}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 + fontOffset }}>
                        {language === 'th' ? 'ส่ง' : 'Send'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remotely add medication */}
                <View style={{ marginTop: 8, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#FFB300', paddingTop: 12 }}>
                  <Text style={{ fontSize: 14 + fontOffset, fontWeight: '800', color: '#333', marginBottom: 6 }}>
                    {language === 'th' ? '➕ เพิ่มรายการยาลงตู้ยาคุณตาทางไกล:' : '➕ Add drug to remote cabinet:'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.remoteInput, { fontSize: 14 + fontOffset }]}
                      placeholder={language === 'th' ? 'ป้อนชื่อยาแล้วกดตกลงเพื่อบันทึกแทน' : 'Type drug name and press enter to add...'}
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
                {isRemoteConnected 
                  ? (language === 'th' ? `รายการยาในตู้ยาคุณตา (${remoteCabinet.length})` : `Meds in Grandpas Cabinet (${remoteCabinet.length})`) 
                  : (language === 'th' ? `รายการยาในตู้ยาล่าสุด (${cabinet.length})` : `Cabinet Medications (${cabinet.length})`)}
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
                      <Text style={styles.medItemText}>{translateMedName(med.name)}</Text>
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
                {isRemoteConnected 
                  ? (language === 'th' ? 'ไม่มีรายการยาในตู้ยาคุณตาบนคลาวด์ขณะนี้ค่ะ' : 'No medications registered in remote cloud.') 
                  : (language === 'th' ? 'ไม่มีรายการยาในตู้ยาของคุณตาขณะนี้ค่ะ' : 'No medications in local cabinet.')}
              </Text>
            )}
          </View>

          {/* Logs of Activities */}
          <View style={[styles.card, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FontAwesome5 name="history" size={24} color="#000" />
                <Text style={styles.cardTitle}>
                  {isRemoteConnected 
                    ? (language === 'th' ? 'ประวัติกิจกรรมคุณตาทางไกล' : 'Grandpas Activity Logs') 
                    : (language === 'th' ? 'บันทึกกิจกรรมล่าสุด' : 'Recent Activity Logs')}
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
                    <Text style={styles.logText}>{translateLogText(log.text)}</Text>
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
