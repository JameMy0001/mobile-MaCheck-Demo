import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, TextInput, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';
import { checkInteraction, saveCustomMed, getAllMeds, addActivityLog } from '../api';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useSound } from '@/hooks/use-sound';
import { useCustomAlert } from '@/hooks/use-custom-alert';
import { useAppStore } from '../store/useAppStore';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { SafetyStatusCard, SeniorButton } from '../components/senior-ui';
import { useTranslation } from '../constants/translations';
import { SafetySeverity, SeniorColors } from '@/constants/senior-theme';

const DEMO_IMAGES: Record<string, any> = {
  case1: require('../../assets/images/demo/sachet_ibuprofen_label.jpg'),
  case2: require('../../assets/images/demo/sachet_amlodipine_label.jpg'),
  case3: require('../../assets/images/demo/sachet_ibuprofen_label.jpg'),
  case4: require('../../assets/images/demo/sachet_ibuprofen_label.jpg'),
  unknown: null,
};

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const [activeCase, setActiveCase] = useState<'case1' | 'case2' | 'case3' | 'case4' | 'unknown'>('case1');

  // States for medication selection modal
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dbMeds, setDbMeds] = useState<any[]>([]);
  const [filteredMeds, setFilteredMeds] = useState<any[]>([]);

  // States for new medication form
  const [newMedModalVisible, setNewMedModalVisible] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedShape, setNewMedShape] = useState('');
  const [newMedNotes, setNewMedNotes] = useState('');
  const [newMedStorage, setNewMedStorage] = useState('');
  const [newMedSeverity, setNewMedSeverity] = useState<'green' | 'yellow' | 'red'>('green');
  const [newMedClashInput, setNewMedClashInput] = useState('');
  const [newMedDiseaseInput, setNewMedDiseaseInput] = useState<string[]>([]);

  // User Profile + shared settings from store
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);
  const setActiveChallenge = useAppStore((state) => state.setActiveChallenge);

  const { doctorMode } = useDoctorMode();
  const { fontOffset } = useFontSize();
  const { handleSpeak } = useSound();
  const { customAlert, setCustomAlert } = useCustomAlert();
  const { t, language } = useTranslation();

  const navigation = useNavigation();

  useEffect(() => {
    handleSpeak('เปิดกล้องแล้วค่ะ โปรดวางซองยาไว้ตรงหน้ากล้อง ถ่ายรูปเพื่อให้หลานวิเคราะห์ออฟไลน์ได้เลยนะคะ');
    loadDbMeds();
  }, []);

  const loadDbMeds = async () => {
    const meds = await getAllMeds();
    setDbMeds(meds);
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {language === 'th' ? 'ต้องอนุญาตให้ใช้กล้องก่อนนะคะคุณตา' : 'Camera permission is required.'}
        </Text>
        <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
          <Text style={styles.actionBtnText}>{language === 'th' ? 'อนุญาต' : 'Allow'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!isScanning) {
      setIsScanning(true);
      try {
        if (cameraRef.current) {
          try {
            await cameraRef.current.takePictureAsync({ quality: 0.1 });
          } catch (e) {
            console.log('Shutter audio mock bypass');
          }
        }
        
        handleSpeak('ถ่ายภาพเสร็จแล้วค่ะ กำลังวิเคราะห์รูปภาพยาด้วยระบบเอไอออฟไลน์นะคะ');
        
        setTimeout(async () => {
          let caseResult: any = {};
          
          if (activeCase === 'case1') {
            caseResult = {
              name: 'Ibuprofen (ยาแก้ปวดอักเสบข้อ/กล้ามเนื้อ)',
              severity: 'red',
              descTh: 'ตรวจพบคู่ยาที่ระบบจัดเป็นกลุ่มห้ามทานร่วมกันค่ะ\n\nคำแนะนำ: ห้ามกินร่วมกันเด็ดขาด หยุดก่อน และให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ',
              speechTh: 'ห้ามกินยานี้ร่วมกับยาในตู้ค่ะ หยุดก่อนและให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ'
            };
          } else if (activeCase === 'case2') {
            caseResult = {
              name: 'Amlodipine (ยาลดความดันโลหิตสูง)',
              severity: 'green',
              descTh: '✅ ปลอดภัย ทานร่วมกันได้!\n\nยาที่สแกน: Amlodipine (ยาลดความดันโลหิตสูง)\nยาในตู้ของคุณตา: Simvastatin (ยาลดไขมันในเลือด)\n\nผลการวิเคราะห์: ยาทั้ง 2 ชนิดนี้สามารถรับประทานร่วมกันได้อย่างปลอดภัยตามขนาดและเวลาที่แพทย์สั่งค่ะคุณตา',
              speechTh: 'ยาลดความดันโลหิตสูงแอมโลดิพีนสามารถทานร่วมกับยาลดไขมันซิมวาสตาตินในตู้ยาได้อย่างปลอดภัยค่ะคุณตา'
            };
          } else if (activeCase === 'case3') {
            caseResult = {
              name: 'Ibuprofen (ยาแก้ปวดอักเสบข้อ/กล้ามเนื้อ)',
              severity: 'yellow',
              descTh: '⚠️ ควรระวังและเว้นระยะห่าง!\n\nยาที่สแกน: Ibuprofen (ยาแก้ปวดอักเสบข้อ/กล้ามเนื้อ)\nยาในตู้ของคุณตา: Metformin (ยาควบคุมเบาหวาน/ยาลดน้ำตาล)\n\nผลการวิเคราะห์: ควรระวัง! ยา 2 ชนิดนี้ควรทานห่างกันอย่างน้อย 2 ชั่วโมง และควรจิบน้ำสะอาดบ่อย ๆ ระหว่างวัน เพื่อป้องกันความดันโลหิตและถนอมการทำงานของไตค่ะ',
              speechTh: 'ควรระวังค่ะ ยาแก้ปวดไอบูโพรเฟนควรทานห่างจากยาเบาหวานอย่างน้อยสองชั่วโมงพร้อมจิบน้ำบ่อยๆ นะคะคุณตา'
            };
          } else if (activeCase === 'case4') {
            caseResult = {
              name: 'Ibuprofen (ยาแก้ปวดอักเสบข้อ/กล้ามเนื้อ)',
              severity: 'red',
              descTh: 'ตรวจพบข้อห้ามใช้กับข้อมูลสุขภาพที่บันทึกไว้ค่ะ\n\nคำแนะนำ: ห้ามรับประทานยานี้เอง หยุดก่อน และให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ',
              speechTh: 'ห้ามรับประทานยานี้เองค่ะ หยุดก่อนและให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ'
            };
          } else {
            caseResult = {
              name: 'ไม่พบข้อมูลยาในระบบ (ไม่สามารถระบุการใช้งาน)',
              severity: 'unknown',
              error: 'ไม่มีในฐานข้อมูลของระบบ',
              descTh: '🔍 ไม่พบข้อมูลซองยา!\n\nผลการวิเคราะห์: รูปภาพซองยาที่สแกนอยู่นี้ ไม่มีในฐานข้อมูลของระบบตู้นะคะ\n\nคำแนะนำ: กรุณาติดต่อลูกหลานหรือแพทย์ผู้รักษาเพื่อเพิ่มข้อมูลยาตัวใหม่นี้ลงตู้ยาผ่านหน้าหลักค่ะ',
              speechTh: 'ขออภัยค่ะ ไม่มีข้อมูลซองยานี้ในฐานข้อมูลของระบบค่ะ'
            };
          }
          
          setResult({
            photo: DEMO_IMAGES[activeCase],
            ...caseResult
          });
          
          await addActivityLog(`คุณตาสแกนทดสอบกรณีตัวอย่าง: ${activeCase} (${caseResult.name}) - ผลลัพธ์: ${caseResult.severity}`);
          setIsScanning(false);
        }, 1500);
      } catch (e: any) {
        console.error(e);
        setIsScanning(false);
      }
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredMeds([]);
      return;
    }
    const filtered = dbMeds.filter(med => 
      med.keywords.some((kw: string) => kw.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredMeds(filtered);
  };

  const selectMed = async (medName: string) => {
    setSelectModalVisible(false);
    setIsScanning(true);
    handleSpeak(`กำลังวิเคราะห์ความปลอดภัยของยา ${medName} รอสักครู่นะคะ`);

    try {
      // ดึงโรคประจำตัวคุณตา
      const diseases = profile ? profile.diseases : [];
      const allergies = profile ? profile.allergies : [];

      // วิเคราะห์
      const safetyResult = await checkInteraction(medName, cabinet, diseases, allergies);

      setResult({
        photo: photoUri,
        name: medName,
        ...safetyResult
      });

      await addActivityLog(`คุณตาสแกนเช็กยา: "${medName}" (ผลลัพธ์ระดับสี: ${safetyResult?.severity})`);
      handleSpeak(safetyResult?.speechTh || 'ตรวจสอบเรียบร้อยแล้วค่ะ');

    } catch (e: any) {
      console.error(e);
      handleSpeak('ระบบขัดข้องไม่สามารถวิเคราะห์ได้ค่ะ');
      setResult({ error: 'ไม่สามารถตรวจวิเคราะห์ยาได้: ' + e.message });
    } finally {
      setIsScanning(false);
    }
  };

  const saveAndSelectNewMed = async () => {
    if (!newMedName.trim()) {
      setCustomAlert({
        visible: true,
        title: 'ข้อมูลไม่ครบ',
        message: 'กรุณาระบุชื่อยาที่คุณตาต้องการบันทึกก่อนนะคะ',
        type: 'warning'
      });
      return;
    }

    const clashes = newMedClashInput ? newMedClashInput.split(',').map(s => s.trim().toLowerCase()) : [];

    const newMed = {
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      shape: newMedShape.trim(),
      notes: newMedNotes.trim(),
      storageTh: newMedStorage.trim(),
      severity: newMedSeverity,
      clashWith: clashes,
      diseases: newMedDiseaseInput,
      descTh: `ยาใหม่ระบุโดยคุณตา/ลูกหลาน: ห้ามกินคู่กับยา: [${clashes.join(', ')}] | วิธีทาน: ${newMedNotes.trim()}`,
      speechTh: newMedSeverity === 'red' 
        ? `ยาตัวนี้เป็นยาอันตราย ห้ามทานคู่กับยาในตู้นะคะคุณตา` 
        : `ทานได้อย่างปลอดภัยค่ะ แต่ถ้าปวดเมื่อยหรือคลื่นไส้ให้แจ้งหลานทันทีนะคะ`
    };

    await saveCustomMed(newMed);
    await loadDbMeds(); // รีโหลด DB เพื่อให้มีรายการยาใหม่
    
    setNewMedModalVisible(false);
    setSelectModalVisible(false);
    
    // รีเซ็ตค่าฟอร์ม
    setNewMedName('');
    setNewMedDosage('');
    setNewMedShape('');
    setNewMedNotes('');
    setNewMedStorage('');
    setNewMedSeverity('green');
    setNewMedClashInput('');
    setNewMedDiseaseInput([]);

    // ดำเนินการวิเคราะห์
    await selectMed(newMed.name);
  };

  const toggleDiseaseSelection = (dId: string) => {
    if (newMedDiseaseInput.includes(dId)) {
      setNewMedDiseaseInput(newMedDiseaseInput.filter(id => id !== dId));
    } else {
      setNewMedDiseaseInput([...newMedDiseaseInput, dId]);
    }
  };

  const startMedSpacingChallenge = async () => {
    if (!result) return;
    try {
      // บันทึกสถานะเพื่อบอกว่าเริ่มภารกิจ
      const challenge = {
        medName: result.name,
        timeLeft: 7200, // 2 ชม. (7200 วินาที)
        maxTime: 7200,
        waterCups: 0
      };
      await setActiveChallenge(challenge as any);
      await addActivityLog(`เริ่มชาเลนจ์ความปลอดภัยของยาแก้ปวด: "${result.name}"`);
      handleSpeak('เริ่มชาเลนจ์จิบน้ำและเว้นระยะยาแก้ปวด 2 ชั่วโมงให้คุณตาแล้วค่ะ');
      setCustomAlert({
        visible: true,
        title: language === 'th' ? 'ภารกิจเริ่มต้นแล้ว!' : 'Challenge Started!',
        message: language === 'th' 
          ? 'เริ่มภารกิจจำลองความปลอดภัยแล้วค่ะ คุณตาสามารถดูแถบเวลานับถอยหลังและกดบันทึกจิบน้ำสะสมได้ที่หน้าจอหลักนะคะ!' 
          : 'Safety challenge has started. You can view the countdown timer and log water intake on the home screen!',
        type: 'success',
        onDismiss: () => {
          router.replace('/');
        }
      });

    } catch (e) {
      console.error(e);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setPhotoUri(null);
    handleSpeak('พร้อมสแกนยาซองต่อไปแล้วค่ะคุณตา');
  };

  const getResultTone = (severity: string): {
    severity: SafetySeverity;
    title: string;
    description: string;
    action: string;
  } => {
    if (severity === 'red') {
      return {
        severity: 'red',
        title: language === 'th' ? 'ห้ามกิน' : 'Do Not Take',
        description: language === 'th' ? 'ระบบจัดรายการนี้เป็นกลุ่มห้ามใช้หรือห้ามทานร่วมกัน' : 'This drug is classified as a high-risk clash.',
        action: language === 'th' ? 'หยุดก่อน อย่าทดลองทานเอง และติดต่อแพทย์ เภสัชกร หรือลูกหลานเพื่อยืนยันความปลอดภัย' : 'Do not ingest. Contact doctor, pharmacist or caregiver immediately.',
      };
    }
    if (severity === 'yellow') {
      return {
        severity: 'yellow',
        title: language === 'th' ? 'ต้องเว้นระยะ' : 'Must Space Doses',
        description: language === 'th' ? 'กินได้เฉพาะเมื่อเว้นระยะและทำตามคำแนะนำอย่างระมัดระวัง' : 'Take only if spaced out properly and follow cautions.',
        action: language === 'th' ? 'เริ่มภารกิจเว้นระยะยา หรือถามลูกหลานก่อนกิน' : 'Start drug spacing challenge or call family first.',
      };
    }
    if (severity === 'green') {
      return {
        severity: 'green',
        title: language === 'th' ? 'ปลอดภัย' : 'Safe',
        description: language === 'th' ? 'ไม่พบปฏิกิริยาสำคัญกับข้อมูลในตู้ยาขณะนี้' : 'No recorded interactions found with current cabinet.',
        action: language === 'th' ? 'กินตามขนาดและเวลาที่แพทย์สั่งตามปกติ' : 'Ingest normally according to prescription instructions.',
      };
    }
    return {
      severity: 'unknown',
      title: language === 'th' ? 'ไม่พบข้อมูล' : 'No Data Found',
      description: language === 'th' ? 'ระบบยังไม่มีข้อมูลยานี้ในฐานข้อมูลเครื่อง' : 'Drug is not registered in offline database.',
      action: language === 'th' ? 'ให้ลูกหลานหรือแพทย์ช่วยตรวจสอบก่อนกินยา' : 'Ask caregivers or doctors to review safety before ingestion.',
    };
  };

  const translateScannerText = (text: string) => {
    if (language === 'th') return text;
    let translated = text;
    // Replace reasons
    translated = translated.replace(/ระบบพบข้อมูลที่อยู่ในกลุ่มห้ามใช้หรือห้ามทานร่วมกัน จึงไม่แสดงรายละเอียดผลกระทบเพิ่มเติมเพื่อความปลอดภัยค่ะ/g, 'The system detected a high-risk prohibited medication or drug clash, and has hidden further details for safety purposes.');
    translated = translated.replace(/ปลอดภัย ทานร่วมกันได้!/g, 'Safe to take together!');
    translated = translated.replace(/ยาที่สแกน:/g, 'Scanned Med:');
    translated = translated.replace(/ยาในตู้ของคุณตา:/g, 'Cabinet Med:');
    translated = translated.replace(/ผลการวิเคราะห์:/g, 'Analysis Result:');
    translated = translated.replace(/ยาทั้ง 2 ชนิดนี้สามารถรับประทานร่วมกันได้อย่างปลอดภัยตามขนาดและเวลาที่แพทย์สั่งค่ะคุณตา/g, 'These two medications can be taken together safely according to your physician\'s instructions.');
    translated = translated.replace(/พบความเสี่ยงตีกับยาในตู้:/g, 'Found risk of interaction with cabinet med:');
    translated = translated.replace(/ยาแก้ปวดกลุ่ม NSAIDs ตัวนี้ห้ามทานนะคะ! เพราะจะทำให้ความดันขึ้น ไตพัง และกัดกระเพาะอย่างรุนแรง แถมยังตีกับยาละลายลิ่มเลือดด้วยค่ะ/g, 'Do not take this NSAID pain reliever! It increases blood pressure, harms kidneys, irritates the stomach, and clashes with blood thinners.');
    translated = translated.replace(/ตรวจพบประวัติแพ้ยารุนแรงของผู้ใช้/g, 'Detected severe user drug allergy history');
    
    // CPM (Yellow)
    translated = translated.replace(/ยาแก้แพ้เม็ดสีเหลือง \(ลดน้ำมูก \/ แก้แพ้คัน \/ ช่วยให้นอนหลับง่าย\)/g, 'Yellow Allergy Pill (CPM / Anti-histamine)');
    translated = translated.replace(/ยาแก้แพ้เม็ดสีเหลือง \(ลดน้ำมูก\/แก้แพ้คัน\/ช่วยให้นอนหลับง่าย\)/g, 'Yellow Allergy Pill (CPM / Anti-histamine)');
    // Cetirizine (White)
    translated = translated.replace(/ยาแก้แพ้เม็ดสีขาว \(แก้แพ้คัน \/ ลดน้ำมูก \/ ชนิดไม่ง่วงนอน\)/g, 'White Allergy Pill (Cetirizine / Non-drowsy)');
    translated = translated.replace(/ยาแก้แพ้เม็ดสีขาว \(แก้แพ้คัน\/ลดน้ำมูก\/ชนิดไม่ง่วงนอน\)/g, 'White Allergy Pill (Cetirizine / Non-drowsy)');
    // Ibuprofen
    translated = translated.replace(/ยาแก้ปวดอักเสบไอบูโพรเฟน \(แก้ปวดกล้ามเนื้อ\/กระดูกอักเสบชนิดรุนแรง\)/g, 'Ibuprofen (NSAIDs Pain Reliever)');
    translated = translated.replace(/ยาแก้ปวดอักเสบไอบูโพรเฟน/g, 'Ibuprofen');
    // Warfarin
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด \(Warfarin\)/g, 'Blood Thinner (Warfarin)');
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด \/ ยาต้านลิ่มเลือดอุดตันในเส้นเลือด/g, 'Blood Thinner (Warfarin / Aspirin)');
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด/g, 'Blood Thinner');
    // Simvastatin
    translated = translated.replace(/ยาลดไขมัน \(Simvastatin\)/g, 'Cholesterol Lowering (Simvastatin)');
    translated = translated.replace(/ยาลดไขมันในเส้นเลือด ซิมวาสแตติน/g, 'Cholesterol Lowering (Simvastatin)');
    translated = translated.replace(/ยาลดไขมันในเส้นเลือด/g, 'Cholesterol Lowering');
    // Amlodipine
    translated = translated.replace(/ยาลดความดัน \(Amlodipine\)/g, 'Hypertension Med (Amlodipine)');
    translated = translated.replace(/ยาลดความดันโลหิตสูง \(ยาความดันปกติประจำวัน\)/g, 'Hypertension Med (Amlodipine / Daily)');
    translated = translated.replace(/ยาลดความดันโลหิตสูง/g, 'Hypertension Med');
    // Lisinopril
    translated = translated.replace(/ยาลดความดัน \(Lisinopril\)/g, 'Hypertension Med (Lisinopril)');
    // Metformin
    translated = translated.replace(/ยาโรคเบาหวาน \(Metformin\)/g, 'Diabetes Med (Metformin)');
    translated = translated.replace(/ยาโรคเบาหวาน เมทฟอร์มิน \(ยาลดระดับน้ำตาลในเลือด\)/g, 'Diabetes Med (Metformin)');
    translated = translated.replace(/ยาโรคเบาหวาน/g, 'Diabetes Med');
    // Paracetamol
    translated = translated.replace(/ยาพาราเซตามอล \(แก้ปวด \/ ลดไข้\)/g, 'Paracetamol (Pain/Fever)');
    translated = translated.replace(/ยาพาราเซตามอล/g, 'Paracetamol');
    // Ponstan
    translated = translated.replace(/ยาแก้ปวดพอนสแตน \(แก้ปวดฟัน \/ ปวดประจำเดือน \/ ปวดข้อกระดูก\)/g, 'Ponstan (Mefenamic Acid / Pain Reliever)');
    translated = translated.replace(/ยาแก้ปวดพอนสแตน \(แก้ปวดฟัน\/ปวดประจำเดือน\/ปวดข้อกระดูก\)/g, 'Ponstan (Mefenamic Acid / Pain Reliever)');
    // Digoxin
    translated = translated.replace(/ยาโรคหัวใจ \(Digoxin\)/g, 'Heart Disease Med (Digoxin)');
    // Amoxicillin
    translated = translated.replace(/ยาฆ่าเชื้อแก้อักเสบ อะม็อกซีซิลลิน/g, 'Antibiotic (Amoxicillin)');
    // Roxithromycin (Strong antibiotics)
    translated = translated.replace(/ยาฆ่าเชื้อแก้อักเสบตัวแรง \(สำหรับคออักเสบ\/ทางเดินหายใจติดเชื้อ\)/g, 'Strong Antibiotic (Roxithromycin)');
    // Antacid
    translated = translated.replace(/ยาลดกรดเคลือบกระเพาะอาหาร \(ชนิดน้ำขาว\/ชนิดเม็ดเคี้ยว\)/g, 'Antacid (Liquid / Chewable)');
    // Omeprazole
    translated = translated.replace(/ยาลดกรดก่อนอาหาร โอเมพราโซล/g, 'Pre-meal Antacid (Omeprazole)');
    // Gemfibrozil
    translated = translated.replace(/ยาลดไขมันในเส้นเลือด เจมไฟโบรซิล/g, 'Cholesterol Med (Gemfibrozil)');
    return translated;
  };

  const cleanResultDescription = (text?: string) => {
    if (!text) return language === 'th' ? 'ไม่มีรายละเอียดเพิ่มเติม' : 'No additional details available';
    return text.replace(/[❌✅⚠️🔍]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  };

  const getResultReason = (severity: string, text?: string) => {
    if (severity === 'red') {
      return language === 'th' 
        ? 'ระบบพบข้อมูลที่อยู่ในกลุ่มห้ามใช้หรือห้ามทานร่วมกัน จึงไม่แสดงรายละเอียดผลกระทบเพิ่มเติมเพื่อความปลอดภัยค่ะ' 
        : 'The system detected a high-risk prohibited medication or drug clash, and has hidden further details for safety purposes.';
    }
    return cleanResultDescription(text);
  };

  const renderModals = () => {
    return (
      <>
        {/* Select Med Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectModalVisible}
          onRequestClose={() => setSelectModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="search" size={22} color="#000" />
                  <Text style={styles.modalTitle}>
                    {language === 'th' ? 'ระบุชื่อยาที่แสกน' : 'Search Medication'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
                  <Feather name="x" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalSearchInput}
                placeholder={language === 'th' ? 'พิมพ์ชื่อยาที่นี่... (เช่น พารา, ไอบู)' : 'Type medicine name... (e.g. Paracetamol)'}
                value={searchText}
                onChangeText={handleSearchChange}
              />

              <ScrollView style={styles.suggestionScroll}>
                {filteredMeds.length > 0 ? (
                  filteredMeds.map(med => (
                    <TouchableOpacity 
                      key={med.id || med.keywords[0]} 
                      style={styles.suggestionItem}
                      onPress={() => selectMed(med.keywords[0])}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Image 
                          source={require('../../assets/images/icons/icon_pill.png')} 
                          style={{ width: 20, height: 20, resizeMode: 'contain' }} 
                        />
                        <Text style={styles.suggestionText}>
                          {translateScannerText(med.formalName || med.keywords[0])}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : searchText.trim().length > 0 ? (
                  <View style={styles.noMedContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="x-circle" size={22} color="#D32F2F" />
                      <Text style={styles.noMedText}>ไม่พบข้อมูลยานี้ในระบบเครื่องค่ะ</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.addNewMedBtn}
                      onPress={() => setNewMedModalVisible(true)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Feather name="plus-circle" size={18} color="#FFF" />
                        <Text style={styles.addNewMedBtnText}>เพิ่มข้อมูลยาตัวใหม่ลงระบบ</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.helpContainer}>
                    <Text style={styles.helpText}>ลองเลือกยาสามัญด้านล่างเพื่อสาธิต:</Text>
                    {dbMeds.slice(0, 6).map(med => (
                      <TouchableOpacity 
                        key={med.id || med.keywords[0]} 
                        style={styles.demoMedBtn}
                        onPress={() => selectMed(med.keywords[0])}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Feather name="arrow-right" size={16} color="#0288D1" />
                          <Text style={styles.demoMedText}>{med.formalName || med.keywords[0]}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add New Custom Med Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={newMedModalVisible}
          onRequestClose={() => setNewMedModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <ScrollView contentContainerStyle={styles.newMedModalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="plus-circle" size={22} color="#000" />
                  <Text style={styles.modalTitle}>ลงทะเบียนข้อมูลยาใหม่</Text>
                </View>
                <TouchableOpacity onPress={() => setNewMedModalVisible(false)}>
                  <Feather name="x" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Image source={require('../../assets/images/icons/icon_pill.png')} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
                  <Text style={styles.formLabel}>ชื่อยาภาษาอังกฤษ/ไทย (จำเป็น)</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="ตัวอย่าง: Diclofenac หรือ ไดโคลฟีแนค"
                  value={newMedName}
                  onChangeText={setNewMedName}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FontAwesome5 name="info-circle" size={14} color="#000" />
                    <Text style={styles.formLabel}>ขนาดของยา</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    placeholder="เช่น 50 มก."
                    value={newMedDosage}
                    onChangeText={setNewMedDosage}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FontAwesome5 name="eye" size={14} color="#000" />
                    <Text style={styles.formLabel}>ลักษณะเม็ดยา</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    placeholder="เช่น เม็ดกลมสีเหลือง"
                    value={newMedShape}
                    onChangeText={setNewMedShape}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FontAwesome5 name="stethoscope" size={14} color="#000" />
                  <Text style={styles.formLabel}>คำสั่งแพทย์ / วิธีรับประทาน</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="เช่น ทานหลังอาหารทันทีเช้า-เย็น"
                  value={newMedNotes}
                  onChangeText={setNewMedNotes}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FontAwesome5 name="box" size={14} color="#000" />
                  <Text style={styles.formLabel}>วิธีการเก็บรักษายา</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="เช่น เก็บพ้นแสงแดดและห้ามแช่ตู้เย็น"
                  value={newMedStorage}
                  onChangeText={setNewMedStorage}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Feather name="alert-triangle" size={16} color="#000" />
                  <Text style={styles.formLabel}>ตีกับยาตัวไหนบ้าง (ระบุคำสำคัญคั่นด้วยเครื่องหมายจุลภาค ,)</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="เช่น warfarin, aspirin"
                  value={newMedClashInput}
                  onChangeText={setNewMedClashInput}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Feather name="slash" size={16} color="#000" />
                  <Text style={styles.formLabel}>ห้ามใช้ในโรคประจำตัวประเภทไหนบ้าง</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  {[
                    { id: 'hypertension', name: 'ความดันสูง' },
                    { id: 'diabetes', name: 'เบาหวาน' },
                    { id: 'heart', name: 'โรคหัวใจ' },
                    { id: 'lipid', name: 'ไขมันสูง' },
                    { id: 'kidney', name: 'โรคไต' },
                    { id: 'stomach', name: 'โรคกระเพาะ' },
                    { id: 'liver', name: 'โรคตับ' }
                  ].map(d => {
                    const isSelected = newMedDiseaseInput.includes(d.id);
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                        onPress={() => toggleDiseaseSelection(d.id)}
                      >
                        <Text style={[styles.checkboxText, isSelected && styles.checkboxTextSelected]}>
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Image source={require('../../assets/images/icons/icon_siren.png')} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
                  <Text style={styles.formLabel}>ระดับความอันตราย</Text>
                </View>
                <View style={styles.radioGroup}>
                  {(['green', 'yellow', 'red'] as const).map((level) => {
                    const isSelected = newMedSeverity === level;
                    const color = level === 'red' ? '#D32F2F' : level === 'yellow' ? '#FBC02D' : '#4CAF50';
                    const label = level === 'red' ? 'ห้ามกินคู่เด็ดขาด' : level === 'yellow' ? 'ต้องเว้นระยะห่าง' : 'ปลอดภัยใช้ทั่วไป';
                    
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.radioButton, isSelected && { backgroundColor: color, borderColor: '#000' }]}
                        onPress={() => setNewMedSeverity(level)}
                      >
                        <Text style={[styles.radioText, isSelected && { color: '#FFF' }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveAndSelectNewMed}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="save" size={20} color="#FFF" />
                  <Text style={styles.saveBtnText}>บันทึกข้อมูลและตรวจวิเคราะห์ทันที</Text>
                </View>
              </TouchableOpacity>

            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

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
      </>
    );
  };

  // Result Screen
  if (result) {
    const isError = !!result.error;
    const tone = getResultTone(isError ? 'unknown' : result.severity);

    return (
      <SafeAreaView style={[styles.safeArea, styles.resultSafeArea, doctorMode && { backgroundColor: '#37474F' }]}>
        <ScrollView contentContainerStyle={styles.resultScrollContent}>
          <View style={[styles.scanPreviewCard, doctorMode && { borderColor: '#000' }]}>
            {result.photo ? (
              <Image source={typeof result.photo === 'number' ? result.photo : { uri: result.photo }} style={styles.previewImg} />
            ) : (
              <View style={[styles.previewImg, styles.emptyPreview]}>
                <Feather name="help-circle" size={80} color="#78909C" />
              </View>
            )}
            <Text selectable style={[styles.medNameText, { fontSize: 22 + fontOffset }, doctorMode && { color: '#000' }]}>
              {translateScannerText(result.name)}
            </Text>
            {!isError && (
              <SeniorButton
                label={language === 'th' ? 'เปลี่ยนชื่อยา' : 'Change Name'}
                icon={{ name: 'edit' }}
                doctorMode={doctorMode}
                fontOffset={fontOffset}
                variant="ghost"
                onPress={() => {
                  handleSpeak(language === 'th' ? 'เลือกหรือพิมพ์ชื่อยาที่ถูกต้องได้เลยค่ะ' : 'Please type or select the correct medication.');
                  setSearchText('');
                  setFilteredMeds([]);
                  setSelectModalVisible(true);
                }}
              />
            )}
          </View>

          <SafetyStatusCard
            severity={tone.severity}
            title={tone.title}
            description={tone.description}
            doctorMode={doctorMode}
            fontOffset={fontOffset}
            sections={[
              { label: language === 'th' ? 'ยาที่สแกน' : 'Scanned Med', value: translateScannerText(result.name) },
              { label: language === 'th' ? 'เหตุผล' : 'Reason', value: translateScannerText(getResultReason(tone.severity, isError ? result.error : result.descTh)) },
              { label: language === 'th' ? 'สิ่งที่ควรทำ' : 'What you should do', value: tone.action },
            ]}
            action={
              result.severity === 'yellow' ? (
                <SeniorButton
                  label={language === 'th' ? 'เริ่มภารกิจเว้นระยะยา' : 'Start Spacing Task'}
                  icon={{ name: 'clock' }}
                  doctorMode={doctorMode}
                  fontOffset={fontOffset}
                  onPress={startMedSpacingChallenge}
                />
              ) : null
            }
          />

          <SeniorButton
            label={language === 'th' ? 'สแกนอีกครั้ง' : 'Scan Again'}
            icon={{ name: 'refresh-cw' }}
            doctorMode={doctorMode}
            fontOffset={fontOffset}
            variant="secondary"
            onPress={resetScanner}
            style={styles.resetSeniorButton}
          />
        </ScrollView>

        {renderModals()}

      </SafeAreaView>
    );
  }

  // Camera Screen
  return (
    <SafeAreaView style={styles.safeAreaDark}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.overlay}>
          {/* Staged Presentation Case Selector */}
          <View style={styles.demoSelectorContainer}>
            <Text style={styles.demoSelectorTitle}>
              {language === 'th' ? '🎭 เลือกกรณีตัวอย่าง (คลิกก่อนกดถ่ายภาพ):' : '🎭 Select Demo Case (Click before capturing):'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.demoSelectorScroll}>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case1' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case1');
                  handleSpeak(language === 'th' ? 'เลือกเคสที่หนึ่ง ยาตีกัน ห้ามกินร่วมกันเด็ดขาดค่ะ' : 'Case 1: Severe drug interaction, do not take.');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case1' && styles.demoSelectBtnTextActive]}>
                  {language === 'th' ? '1. ยาตีกัน (แดง)' : '1. Severe Clash (Red)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case2' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case2');
                  handleSpeak(language === 'th' ? 'เลือกเคสที่สอง ยาทานร่วมกันได้อย่างปลอดภัยค่ะ' : 'Case 2: Safe to take together.');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case2' && styles.demoSelectBtnTextActive]}>
                  {language === 'th' ? '2. ทานร่วมกันได้ (เขียว)' : '2. Safe to Take (Green)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case3' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case3');
                  handleSpeak(language === 'th' ? 'เลือกเคสที่สาม ยาควรทานห่างกันสองชั่วโมงค่ะ' : 'Case 3: Space doses by 2 hours.');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case3' && styles.demoSelectBtnTextActive]}>
                  {language === 'th' ? '3. ทานห่างกัน (เหลือง)' : '3. Space 2 Hrs (Yellow)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case4' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case4');
                  handleSpeak(language === 'th' ? 'เลือกเคสที่สี่ ยาห้ามกินกับโรคไตค่ะ' : 'Case 4: Dangerous for Kidney Disease.');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case4' && styles.demoSelectBtnTextActive]}>
                  {language === 'th' ? '4. ยาต้องห้ามกับโรคไต (แดง)' : '4. Kidney Disease Clash (Red)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'unknown' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('unknown');
                  handleSpeak(language === 'th' ? 'เลือกเคสที่ห้า ยานอกฐานข้อมูลระบบค่ะ' : 'Case 5: Unregistered drug in database.');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'unknown' && styles.demoSelectBtnTextActive]}>
                  {language === 'th' ? '5. ยานอกฐานข้อมูล (เทา)' : '5. Unknown Drug (Gray)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.frame}>
            <View style={styles.frameCornerTL} />
            <View style={styles.frameCornerTR} />
            <View style={styles.frameCornerBL} />
            <View style={styles.frameCornerBR} />
          </View>
          <Text style={styles.guideText}>
            {language === 'th' ? 'วางซองยาไว้ในกรอบแล้วกดปุ่มถ่ายรูป' : 'Place medication package inside target frame and capture'}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.captureBtn, isScanning && styles.captureBtnDisabled]} 
            onPress={takePicture}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Feather name="camera" size={48} color="#000" />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>

      {renderModals()}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  resultSafeArea: {
    backgroundColor: SeniorColors.background,
  },
  resultScrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  safeAreaDark: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SeniorColors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: SeniorColors.danger,
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: SeniorColors.primary,
    borderWidth: 0,
    padding: 16,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  frame: {
    width: 280,
    height: 380,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  frameCornerTL: { position: 'absolute', top: -2, left: -2, width: 40, height: 40, borderTopWidth: 6, borderLeftWidth: 6, borderColor: '#FFF' },
  frameCornerTR: { position: 'absolute', top: -2, right: -2, width: 40, height: 40, borderTopWidth: 6, borderRightWidth: 6, borderColor: '#FFF' },
  frameCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 40, height: 40, borderBottomWidth: 6, borderLeftWidth: 6, borderColor: '#FFF' },
  frameCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 40, height: 40, borderBottomWidth: 6, borderRightWidth: 6, borderColor: '#FFF' },
  guideText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  controls: {
    backgroundColor: '#000',
    padding: 30,
    alignItems: 'center',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: SeniorColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: {
    backgroundColor: '#9E9E9E',
  },
  resultHeader: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  scanPreviewCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 8px 22px rgba(31, 122, 92, 0.10)',
  },
  resultCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    boxShadow: '4px 4px 0px #000',
  },
  previewImg: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    marginBottom: 4,
  },
  emptyPreview: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
  },
  medNameText: {
    fontSize: 26,
    fontWeight: '900',
    color: SeniorColors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  descContainer: {
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 12,
  },
  descText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  challengeBtn: {
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    boxShadow: '2px 2px 0px #000',
  },
  challengeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
    boxShadow: '3px 3px 0px #000',
  },
  resetBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  resetSeniorButton: {
    width: '100%',
    maxWidth: 440,
  },

  // Modal styling
  modalBg: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: SeniorColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: SeniorColors.border,
    padding: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: SeniorColors.text,
  },
  modalSearchInput: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    minHeight: 56,
    marginBottom: 16,
  },
  suggestionScroll: {
    flex: 1,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    backgroundColor: SeniorColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SeniorColors.border,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 17,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  noMedContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  noMedText: {
    fontSize: 18,
    fontWeight: '700',
    color: SeniorColors.danger,
  },
  addNewMedBtn: {
    backgroundColor: SeniorColors.danger,
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 56,
  },
  addNewMedBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  helpContainer: {
    paddingVertical: 10,
  },
  helpText: {
    fontSize: 16,
    fontWeight: '800',
    color: SeniorColors.textSecondary,
    marginBottom: 10,
  },
  demoMedBtn: {
    padding: 10,
    marginBottom: 8,
  },
  demoMedText: {
    fontSize: 17,
    fontWeight: '700',
    color: SeniorColors.info,
  },

  // Form styles
  newMedModalContent: {
    backgroundColor: SeniorColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: SeniorColors.border,
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: SeniorColors.text,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 52,
    color: SeniorColors.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkbox: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  checkboxSelected: {
    backgroundColor: SeniorColors.primary,
    borderColor: SeniorColors.primary,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  checkboxTextSelected: {
    color: '#FFF',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: SeniorColors.surface,
  },
  radioText: {
    fontSize: 13,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  saveBtn: {
    backgroundColor: SeniorColors.primary,
    borderWidth: 0,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 8px 18px rgba(31, 122, 92, 0.18)',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
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
  changeMedNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    boxShadow: '2px 2px 0px #000',
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'center',
  },
  changeMedNameBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  
  // Staged Presentation Selector Styles
  demoSelectorContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 50, 42, 0.92)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderColor: SeniorColors.primary,
    zIndex: 100,
  },
  demoSelectorTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  demoSelectorScroll: {
    paddingHorizontal: 4,
    gap: 8,
  },
  demoSelectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  demoSelectBtnActive: {
    backgroundColor: SeniorColors.primarySoft,
    borderColor: SeniorColors.primary,
  },
  demoSelectBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  demoSelectBtnTextActive: {
    fontWeight: '900',
  },
});
